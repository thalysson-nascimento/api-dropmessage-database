import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import createHttpError from "http-errors";
import { prismaCliente } from "../../database/prismaCliente";
import { authorSelect } from "../global-chat/globalChatRepository";
import { DIRECT_UPLOAD_TTL_SECONDS } from "../../service/cloudinaryDirectUpload.service";

export interface UploadIntent {
  userId: string;
  clientRequestId: string;
  fileName: string;
  declaredBytes: number;
  requestHash: string;
  content?: string;
  replyToId?: string;
  viewOnce: boolean;
  expirationSeconds: number;
}

export class DirectUploadRepository {
  async authorize(input: UploadIntent) {
    return prismaCliente.$transaction(async tx => {
      // Serialize issuance across replicas, preserving per-user quotas.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${input.userId}))::text`;
      const user = await tx.user.findFirst({ where: { id: input.userId, isDeactivated: false }, select: { id: true } });
      if (!user) throw createHttpError(403, "Usuário indisponível para upload");
      const existing = await tx.directUploadSession.findUnique({ where: {
        userId_purpose_clientRequestId: { userId: input.userId, purpose: "GLOBAL_CHAT_IMAGE", clientRequestId: input.clientRequestId },
      } });
      if (existing) {
        if (existing.requestHash !== input.requestHash) throw createHttpError(409, "clientRequestId já utilizado com outros dados");
        return existing;
      }
      const now = new Date();
      const pending = await tx.directUploadSession.count({ where: { userId: input.userId, status: "PENDING", expiresAt: { gt: now } } });
      const recent = await tx.directUploadSession.count({ where: { userId: input.userId, createdAt: { gt: new Date(now.getTime() - 3600_000) } } });
      if (pending >= 3 || recent >= 30) throw createHttpError(429, "Limite de uploads atingido; aguarde antes de tentar novamente");
      if (input.replyToId) {
        const reply = await tx.globalChatMessage.findFirst({ where: { id: input.replyToId, deletedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, select: { id: true } });
        if (!reply) throw createHttpError(404, "Mensagem de referência não encontrada ou expirada");
      }
      const id = randomUUID();
      return tx.directUploadSession.create({ data: { ...input, id, purpose: "GLOBAL_CHAT_IMAGE",
        publicId: `direct-uploads/global-chat/${id}`, expiresAt: new Date(now.getTime() + DIRECT_UPLOAD_TTL_SECONDS * 1000) } });
    });
  }

  markCleanupComplete(publicId: string, resourceType: string, deliveryType: string) {
    return prismaCliente.directUploadSession.updateMany({ where: { publicId, cleanupPending: true,
      cleanupResourceType: resourceType, cleanupDeliveryType: deliveryType }, data: { cleanupPending: false } });
  }

  async pendingCleanup() {
    await prismaCliente.directUploadSession.updateMany({ where: { status: "PUBLISHED", message: { expiresAt: { lte: new Date() } } },
      data: { status: "EXPIRED", rejectionReason: "UPLOAD_EXPIRED", cleanupPending: true, cleanupResourceType: "image", cleanupDeliveryType: "authenticated" } });
    return prismaCliente.directUploadSession.findMany({ where: { cleanupPending: true }, take: 20, orderBy: { updatedAt: "asc" } });
  }

  findOwned(id: string, userId: string) {
    return prismaCliente.directUploadSession.findFirst({ where: { id, userId, purpose: "GLOBAL_CHAT_IMAGE" } });
  }

  async lockByPublicId(tx: Prisma.TransactionClient, publicId: string) {
    const rows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "direct-upload-session" WHERE "publicId" = ${publicId} FOR UPDATE`;
    return rows[0] ? tx.directUploadSession.findUnique({ where: { id: rows[0].id } }) : null;
  }

  async cancel(id: string, userId: string) {
    return prismaCliente.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "direct-upload-session" WHERE id = ${id} AND "userId" = ${userId} FOR UPDATE`;
      const session = await tx.directUploadSession.findFirst({ where: { id, userId, purpose: "GLOBAL_CHAT_IMAGE" } });
      if (!session) throw createHttpError(404, "Upload não encontrado");
      if (session.status === "PUBLISHED") throw createHttpError(409, "Upload publicado: use a exclusão da mensagem");
      if (session.status !== "PENDING") return session;
      return tx.directUploadSession.update({ where: { id }, data: { status: "CANCELED" } });
    });
  }

  async complete(publicId: string, asset: { assetId: string; bytes: number; format: string; uploadedAt: Date; resourceType: string; deliveryType: string }, rejection?: string) {
    return prismaCliente.$transaction(async tx => {
      const session = await this.lockByPublicId(tx, publicId);
      if (!session || session.purpose !== "GLOBAL_CHAT_IMAGE") return { ignored: true };
      if (session.status === "PUBLISHED") {
        // Replays of the original image are harmless; another resource type cannot be published.
        if (!session.messageId || asset.resourceType !== "image" || asset.deliveryType !== "authenticated") {
          const queued = await tx.directUploadSession.update({ where: { id: session.id }, data: {
            cleanupPending: true, cleanupResourceType: asset.resourceType, cleanupDeliveryType: asset.deliveryType,
          } });
          return { session: queued, cleanup: true };
        }
        return { session, published: false };
      }
      if (session.status !== "PENDING") {
        const queued = await tx.directUploadSession.update({ where: { id: session.id }, data: {
          cleanupPending: true, cleanupResourceType: asset.resourceType, cleanupDeliveryType: asset.deliveryType,
        } });
        return { session: queued, cleanup: true };
      }
      const now = new Date();
      let reason = rejection;
      // Allow webhook retries for an upload completed within the grant window.
      if (asset.uploadedAt > session.expiresAt || asset.uploadedAt < new Date(session.createdAt.getTime() - 60_000) ||
          now.getTime() > session.expiresAt.getTime() + 20 * 60_000) reason = "UPLOAD_EXPIRED";
      const user = await tx.user.findFirst({ where: { id: session.userId, isDeactivated: false }, select: { id: true } });
      if (!user) reason = "USER_UNAVAILABLE";
      if (session.replyToId) {
        const reply = await tx.globalChatMessage.findFirst({ where: { id: session.replyToId, deletedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, select: { id: true } });
        if (!reply) reason = "REPLY_UNAVAILABLE";
      }
      if (reason) {
        const rejected = await tx.directUploadSession.update({ where: { id: session.id }, data: { status: "REJECTED", rejectionReason: reason, cleanupPending: true,
          cleanupResourceType: asset.resourceType, cleanupDeliveryType: asset.deliveryType } });
        return { session: rejected, cleanup: true };
      }
      const message = await tx.globalChatMessage.create({ data: {
        userId: session.userId, type: "IMAGE", content: session.content, image: session.publicId,
        fileName: session.fileName, format: asset.format, optimizedSize: asset.bytes,
        viewOnce: session.viewOnce, expiresAt: new Date(now.getTime() + session.expirationSeconds * 1000),
        replyToId: session.replyToId,
      }, include: { user: { select: authorSelect } } });
      const completed = await tx.directUploadSession.update({ where: { id: session.id },
        data: { status: "PUBLISHED", messageId: message.id, assetId: asset.assetId } });
      return { session: completed, message, published: true };
    });
  }
}
