import { createHash, randomUUID } from "crypto";
import { prismaCliente } from "../../database/prismaCliente";
import { DIRECT_UPLOAD_TTL_SECONDS, canonicalDirectUploadId } from "../../service/cloudinaryDirectUpload.service";
import { MediaIntent, CloudAsset, validateConfirmedAsset, mediaError } from "./mediaUploadContract";
import { checkMediaPermission, publishMediaDomain, queueMediaCleanup } from "./mediaDomainPublisher";

export const mediaSessionInclude = { assets: { orderBy: { role: "asc" as const } } };
export class MediaUploadRepository {
  async authorize(userId: string, input: MediaIntent) {
    const purpose = `MEDIA:${input.domain}`;
    const requestHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    return prismaCliente.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))::text`;
      const existing = await tx.directUploadSession.findUnique({ where: { userId_purpose_clientRequestId: { userId, purpose, clientRequestId: input.clientRequestId } }, include: mediaSessionInclude });
      if (existing) {
        if (existing.requestHash !== requestHash) throw mediaError(409, "UPLOAD_KEY_CONFLICT", "clientRequestId já utilizado com outros dados");
        if (existing.status === "PENDING" && existing.expiresAt > new Date()) {
          const user = await checkMediaPermission(tx, userId, input.domain, input.metadata);
          if (existing.avatarRevision !== null && existing.avatarRevision !== user.avatarUploadRevision)
            throw mediaError(409, "AVATAR_SUPERSEDED", "Existe uma intenção mais recente");
        }
        return { session: existing, reused: true };
      }
      await checkMediaPermission(tx, userId, input.domain, input.metadata);
      const now = new Date();
      const active = await tx.directUploadSession.count({ where: { userId, status: "PENDING", expiresAt: { gt: now } } });
      const recent = await tx.directUploadSession.count({ where: { userId, createdAt: { gt: new Date(now.getTime() - 3600_000) } } });
      if (active >= 3 || recent >= 30) throw mediaError(429, "UPLOAD_QUOTA", "Limite de uploads atingido");
      let avatarRevision: number | undefined;
      if (input.domain === "avatar" || input.domain === "avatar-update") {
        avatarRevision = (await tx.user.update({ where: { id: userId }, data: { avatarUploadRevision: { increment: 1 } }, select: { avatarUploadRevision: true } })).avatarUploadRevision;
      }
      const id = randomUUID();
      const main = input.assets.find(a => a.role === "image")!;
      const created = await tx.directUploadSession.create({ data: {
        id, userId, purpose, clientRequestId: input.clientRequestId, requestHash, metadata: input.metadata,
        publicId: `direct-uploads/media/${id}/image`, fileName: main.fileName, declaredBytes: main.bytes,
        viewOnce: input.domain === "private-chat" ? input.metadata.viewOnce : false,
        expirationSeconds: 0, expiresAt: new Date(now.getTime() + DIRECT_UPLOAD_TTL_SECONDS * 1000), avatarRevision,
        assets: { create: input.assets.map(a => ({ role: a.role, publicId: `direct-uploads/media/${id}/${a.role}`,
          fileName: a.fileName, mimeType: a.mimeType, declaredBytes: a.bytes })) },
      }, include: mediaSessionInclude });
      return { session: created, reused: false };
    });
  }
  findOwned(id: string, userId: string) {
    return prismaCliente.directUploadSession.findFirst({ where: { id, userId, purpose: { startsWith: "MEDIA:" } }, include: mediaSessionInclude });
  }
  async cancel(id: string, userId: string) {
    return prismaCliente.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "direct-upload-session" WHERE id = ${id} AND "userId" = ${userId} FOR UPDATE`;
      const session = await tx.directUploadSession.findFirst({ where: { id, userId, purpose: { startsWith: "MEDIA:" } }, include: mediaSessionInclude });
      if (!session) throw mediaError(404, "UPLOAD_NOT_FOUND", "Upload não encontrado");
      if (session.status === "PUBLISHED") throw mediaError(409, "UPLOAD_ALREADY_PUBLISHED", "Recurso publicado; use a exclusão apropriada");
      for (const asset of session.assets) await queueMediaCleanup(tx, asset.publicId);
      if (session.status === "PENDING") await tx.directUploadSession.update({ where: { id }, data: { status: "CANCELED" } });
      return tx.directUploadSession.findUniqueOrThrow({ where: { id }, include: mediaSessionInclude });
    });
  }
  async confirm(remote: CloudAsset) {
    const canonicalId = canonicalDirectUploadId(remote.public_id, remote.resource_type);
    const known = await prismaCliente.directUploadAsset.findUnique({ where: { publicId: canonicalId }, include: { session: true } });
    if (!known) {
      // Account deletion can cascade sessions; a cleanup tombstone still identifies the grant.
      const tombstone = await prismaCliente.mediaCleanupTask.findFirst({ where: { publicId: canonicalId } });
      if (tombstone) await prismaCliente.$transaction(tx => queueMediaCleanup(tx, remote.public_id, remote.resource_type, remote.type));
      return null;
    }
    if (!known.session.purpose.startsWith("MEDIA:")) return null;
    return prismaCliente.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${known.session.userId}))::text`;
      await tx.$queryRaw`SELECT id FROM "direct-upload-session" WHERE id = ${known.sessionId} FOR UPDATE`;
      let session = await tx.directUploadSession.findUniqueOrThrow({ where: { id: known.sessionId }, include: mediaSessionInclude });
      const asset = session.assets.find(a => a.publicId === canonicalId)!;
      if (session.status !== "PENDING") {
        if (session.status !== "PUBLISHED" || !asset.confirmedAt || asset.assetId !== remote.asset_id || remote.resource_type !== "image" || remote.type !== "authenticated")
          await queueMediaCleanup(tx, remote.public_id, remote.resource_type, remote.type);
        return { session, published: false };
      }
      const completed = new Date(remote.created_at);
      let reason = validateConfirmedAsset(remote, asset.role);
      if (completed > session.expiresAt || completed.getTime() < session.createdAt.getTime() - 60_000 || Date.now() > session.expiresAt.getTime() + 20 * 60_000) reason = "UPLOAD_EXPIRED";
      if (reason) {
        for (const a of session.assets) await queueMediaCleanup(tx, a.publicId);
        await queueMediaCleanup(tx, remote.public_id, remote.resource_type, remote.type);
        session = await tx.directUploadSession.update({ where: { id: session.id }, data: { status: "REJECTED", rejectionReason: reason }, include: mediaSessionInclude });
        return { session, published: false };
      }
      if (!asset.confirmedAt) await tx.directUploadAsset.update({ where: { id: asset.id }, data: {
        assetId: remote.asset_id, format: remote.format, bytes: remote.bytes, width: remote.width, height: remote.height,
        version: remote.version, uploadedAt: completed, confirmedAt: new Date(),
      } });
      session = await tx.directUploadSession.findUniqueOrThrow({ where: { id: session.id }, include: mediaSessionInclude });
      if (session.assets.some(a => !a.confirmedAt)) return { session, published: false };
      // ACL failures commit rejection + cleanup; persistence failures roll back for callback retry.
      let published;
      try { published = await publishMediaDomain(tx, session, session.assets); }
      catch (error: any) {
        if (!error.statusCode || error.statusCode >= 500) throw error;
        for (const a of session.assets) await queueMediaCleanup(tx, a.publicId);
        session = await tx.directUploadSession.update({ where: { id: session.id }, data: { status: "REJECTED", rejectionReason: error.code || "PUBLICATION_FORBIDDEN" }, include: mediaSessionInclude });
        return { session, published: false };
      }
      session = await tx.directUploadSession.update({ where: { id: session.id }, data: { status: "PUBLISHED", ...published }, include: mediaSessionInclude });
      return { session, published: true };
    });
  }
}
