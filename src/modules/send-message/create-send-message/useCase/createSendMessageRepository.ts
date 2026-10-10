import { serializePrivateMessage } from "../../privateMessageSerializer";
import { getAvatarThumbnailUrl } from "../../../../service/cloudinary.service";
import { prismaCliente as prisma } from "../../../../database/prismaCliente";
import createHttpError from "http-errors";
import { client } from "../../../../lib/redis";
import { getSocketIO } from "../../../../lib/socket";
import { getImageUrl } from "../../../../service/cloudinary.service";



const messageUserSelect = {
  id: true,
  userHashPublic: true,
  name: true,
  avatar: { select: { image: true, version: true, thumbnail: true, thumbnailVersion: true } },
};

export { serializePrivateMessage } from "../../privateMessageSerializer";

export class CreateSendMessageRepository {
  async getMatchById(matchId: string) {
    return prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        initiatorId: true,
        recipientId: true,
        unMatch: true,
        initiator: { select: { userHashPublic: true, isDeactivated: true } },
        recipient: { select: { userHashPublic: true, isDeactivated: true } },
      },
    });
  }

  async createSendMessage(
    matchId: string,
    userId: string,
    content: string | undefined,
    image?: string,
    fileName?: string,
    format?: string,
    viewOnce = false,
  ) {
    const newMessage = await prisma.message.create({
      data: { matchId, userId, content, image, fileName, format, viewOnce },
      select: {
        id: true,
        matchId: true,
        createdAt: true,
        content: true,
        image: true,
        fileName: true,
        format: true,
        viewOnce: true,
        user: { select: messageUserSelect },
      },
    });

    const serialized = serializePrivateMessage(newMessage);

    try {
      await client.del(`messages:${matchId}:${userId}:0:10`);
    } catch (error) {
      console.error("Falha ao invalidar cache de mensagens privadas", { error });
    }

    try {
      getSocketIO().to(matchId).emit("send-message", serialized);
    } catch (error) {
      console.error("Falha ao emitir evento de mensagem privada", { error });
    }

    return serialized;
  }

  async getMessageForView(messageId: string) {
    return prisma.message.findUnique({
      where: { id: messageId },
      include: {
        user: { select: messageUserSelect },
        match: {
          select: { id: true, initiatorId: true, recipientId: true, unMatch: true,
            initiator: { select: { isDeactivated: true } }, recipient: { select: { isDeactivated: true } } },
        },
        views: { select: { userId: true } },
      },
    });
  }

  async registerView(messageId: string, userId: string) {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "match" WHERE id=(SELECT "matchId" FROM "message" WHERE id=${messageId}) FOR SHARE`;
      const message = await tx.message.findUnique({ where: { id: messageId }, include: { match: true } });
      if (!message || !message.viewOnce || !message.image || message.match.unMatch) throw createHttpError(404, "Foto não disponível");
      if (message.userId === userId || ![message.match.initiatorId, message.match.recipientId].includes(userId))
        throw createHttpError(403, "Acesso não autorizado à foto");
      await tx.$queryRaw`SELECT id FROM "user" WHERE id IN (${message.match.initiatorId}, ${message.match.recipientId}) ORDER BY id FOR SHARE`;
      if (await tx.user.count({ where: { id: { in: [message.match.initiatorId, message.match.recipientId] }, isDeactivated: false } }) !== 2)
        throw createHttpError(404, "Participante indisponível");
      return tx.privateMessageView.createMany({ data: [{ messageId, userId }], skipDuplicates: true });
    });
  }
}
