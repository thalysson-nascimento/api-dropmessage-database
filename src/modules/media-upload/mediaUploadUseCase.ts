import { z } from "zod";
import { prismaCliente } from "../../database/prismaCliente";
import { getSocketIO } from "../../lib/socket";
import { getImageUrl } from "../../service/cloudinary.service";
import { directUploadConfig, signDirectImageUpload, getDirectUploadAsset } from "../../service/cloudinaryDirectUpload.service";
import { serializePrivateMessage } from "../send-message/privateMessageSerializer";
import { MediaUploadRepository } from "./mediaUploadRepository";
import { parseMediaIntent, thumbnailFormats, cloudAssetSchema, CloudAsset, mediaError } from "./mediaUploadContract";
import { processMediaEffects } from "./mediaUploadEffects";

export class MediaUploadUseCase {
  private repository = new MediaUploadRepository();
  async owned(id: string, userId: string) {
    if (!z.string().uuid().safeParse(id).success) throw mediaError(400, "INVALID_UPLOAD_ID", "ID de upload inválido");
    const session = await this.repository.findOwned(id, userId);
    if (!session) throw mediaError(404, "UPLOAD_NOT_FOUND", "Upload não encontrado");
    return session;
  }
  async authorize(userId: string, body: unknown) {
    const input = parseMediaIntent(body);
    directUploadConfig();
    const issued = await this.repository.authorize(userId, input);
    let session = issued.session;
    // Lost callbacks must be reconciled before issuing a second grant for the same public ID.
    if (issued.reused && session.status === "PENDING") {
      for (const asset of session.assets.filter(a => !a.confirmedAt)) await this.reconcileAsset(asset.publicId);
      session = await this.owned(session.id, userId);
    }
    const status = await this.serializeStatus(session);
    return { ...status, uploads: status.status === "PENDING" ? session.assets.filter(a => !a.confirmedAt).map(a => ({
      role: a.role, ...signDirectImageUpload({ ...session, publicId: a.publicId }, a.role === "thumbnail" ? thumbnailFormats : undefined),
    })) : null };
  }
  private async reconcileAsset(publicId: string) {
    let remote;
    try { remote = await getDirectUploadAsset(publicId); }
    catch (error: any) {
      if (error.http_code === 404 || error.error?.http_code === 404) return;
      throw mediaError(503, "CLOUDINARY_UNAVAILABLE", "Não foi possível verificar o upload no Cloudinary");
    }
    const parsed = cloudAssetSchema.safeParse({ ...remote, notification_type: "upload" });
    if (!parsed.success || parsed.data.public_id !== publicId)
      throw mediaError(503, "CLOUDINARY_METADATA_INVALID", "Metadados Cloudinary indisponíveis");
    await this.acceptAsset(parsed.data);
  }
  async reconcile(id: string, userId: string) {
    const session = await this.owned(id, userId);
    if (session.status === "PENDING" && Date.now() <= session.expiresAt.getTime() + 20 * 60_000) {
      for (const asset of session.assets.filter(a => !a.confirmedAt)) await this.reconcileAsset(asset.publicId);
    }
    return this.status(id, userId);
  }
  async cancel(id: string, userId: string) {
    await this.owned(id, userId);
    const session = await this.repository.cancel(id, userId);
    this.emitStatus(session);
    return this.serializeStatus(session);
  }
  async status(id: string, userId: string) { return this.serializeStatus(await this.owned(id, userId)); }
  async acceptAsset(asset: CloudAsset) {
    const confirmation = await this.repository.confirm(asset);
    if (!confirmation) return { received: true, ignored: true };
    this.emitStatus(confirmation.session);
    if (confirmation.published) await processMediaEffects(confirmation.session.id);
    return { received: true };
  }
  private emitStatus(session: any) {
    try { getSocketIO().to(session.userId).emit("upload:status", {
      uploadId: session.id, clientRequestId: session.clientRequestId, domain: session.purpose.slice(6),
      status: session.status, resourceId: session.resourceId, errorCode: session.rejectionReason,
    }); } catch { /* Recover via status endpoint. */ }
  }
  private async result(session: any) {
    const domain = session.purpose.slice(6);
    if (domain === "avatar" || domain === "avatar-update") {
      const avatar = await prismaCliente.avatarCloudinary.findFirst({ where: { id: session.resourceId, userId: session.userId },
        include: { user: { select: { name: true, email: true } } } });
      const expected = session.assets.find((a: any) => a.role === "image");
      if (!avatar || avatar.image !== expected.publicId) return null;
      const thumbnailUrl = avatar.thumbnail ? getImageUrl(avatar.thumbnail, avatar.thumbnailVersion ?? undefined) : null;
      return domain === "avatar"
        ? { image: getImageUrl(avatar.image, avatar.version ?? undefined), thumbnailUrl, createdAt: avatar.createdAt, user: avatar.user }
        : { message: "Avatar updated successfully", avatarUrl: getImageUrl(avatar.image, avatar.version ?? undefined), thumbnailUrl };
    }
    if (domain === "private-chat") {
      const message = await prismaCliente.message.findFirst({ where: { id: session.resourceId, userId: session.userId },
        include: { views: { select: { userId: true } }, user: { select: { userHashPublic: true, name: true, avatar: true } }, match: { include: {
          initiator: { select: { isDeactivated: true } }, recipient: { select: { isDeactivated: true } },
        } } } });
      if (!message || message.match.unMatch || message.match.initiator.isDeactivated || message.match.recipient.isDeactivated) return null;
      return { ...serializePrivateMessage(message), uploadId: session.id };
    }
    const post = await prismaCliente.postMessageCloudinary.findFirst({ where: { id: session.resourceId, userId: session.userId, isExpired: false, expirationTimer: { gt: new Date() } } });
    if (!post) return null;
    const posts = await prismaCliente.postMessageCloudinary.findMany({ where: { userId: session.userId, isExpired: false, expirationTimer: { gt: new Date() } }, orderBy: { createdAt: "desc" }, take: 4, select: { image: true, fileName: true, expirationTimer: true } });
    return { ...session.result, listActivePost: posts.map(p => ({ ...p, image: getImageUrl(p.image) })) };
  }
  async serializeStatus(session: any) {
    const pending = session.status === "PENDING";
    const timedOut = pending && Date.now() > session.expiresAt.getTime();
    const expired = timedOut && Date.now() > session.expiresAt.getTime() + 20 * 60_000;
    const result = session.status === "PUBLISHED" ? await this.result(session) : null;
    return { uploadId: session.id, clientRequestId: session.clientRequestId, domain: session.purpose.slice(6),
      status: expired ? "EXPIRED" : timedOut ? "AWAITING_CONFIRMATION" : session.status,
      expiresAt: session.expiresAt, resourceId: session.resourceId, result,
      unavailable: (session.status === "PUBLISHED" && !result) || session.status === "EXPIRED",
      errorCode: expired ? "UPLOAD_EXPIRED" : session.rejectionReason,
      confirmedRoles: session.assets.filter((a: any) => a.confirmedAt).map((a: any) => a.role),
    };
  }
}
