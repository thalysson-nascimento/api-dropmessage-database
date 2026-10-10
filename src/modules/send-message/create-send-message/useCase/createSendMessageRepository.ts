import { PrismaClient } from "@prisma/client";
import { client } from "../../../../lib/redis";
import { getSocketIO } from "../../../../lib/socket";
import { getImageUrl } from "../../../../service/cloudinary.service";

const prisma = new PrismaClient();

const messageUserSelect = {
  id: true,
  userHashPublic: true,
  name: true,
  avatar: { select: { image: true, version: true } },
};

export function serializePrivateMessage(message: {
  id: string;
  matchId: string;
  createdAt: Date;
  content: string | null;
  image: string | null;
  fileName: string | null;
  viewOnce: boolean;
  user: {
    userHashPublic: string;
    name: string;
    avatar: { image: string; version: number | null } | null;
  };
}) {
  return {
    id: message.id,
    matchId: message.matchId,
    createdAt: message.createdAt,
    content: message.content,
    imageUrl:
      message.image && !message.viewOnce ? getImageUrl(message.image) : null,
    fileName: message.viewOnce ? null : message.fileName,
    viewOnce: message.viewOnce,
    viewOnceStatus: message.viewOnce ? "PENDING" : null,
    user: {
      userHashPublic: message.user.userHashPublic,
      name: message.user.name,
      avatar: message.user.avatar?.image
        ? getImageUrl(
            message.user.avatar.image,
            message.user.avatar.version ?? undefined,
          )
        : null,
    },
  };
}

export class CreateSendMessageRepository {
  async getMatchById(matchId: string) {
    return prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        initiatorId: true,
        recipientId: true,
        unMatch: true,
        initiator: { select: { userHashPublic: true } },
        recipient: { select: { userHashPublic: true } },
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
          select: { id: true, initiatorId: true, recipientId: true, unMatch: true },
        },
        views: { select: { userId: true } },
      },
    });
  }

  async registerView(messageId: string, userId: string) {
    return prisma.privateMessageView.createMany({
      data: [{ messageId, userId }],
      skipDuplicates: true,
    });
  }
}
