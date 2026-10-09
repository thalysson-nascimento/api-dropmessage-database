import { GlobalChatMessageType } from "@prisma/client";
import { prismaCliente } from "../../database/prismaCliente";

const authorSelect = {
  userHashPublic: true,
  name: true,
  avatar: { select: { image: true, version: true } },
};

export class GlobalChatRepository {
  async createMessage(data: {
    userId: string;
    type: GlobalChatMessageType;
    content?: string;
    image?: string;
    fileName?: string;
    format?: string;
    optimizedSize?: number;
    viewOnce: boolean;
    expiresAt?: Date;
    replyToId?: string;
  }) {
    return prismaCliente.globalChatMessage.create({
      data,
      include: { user: { select: authorSelect } },
    });
  }

  async findReply(messageId: string) {
    return prismaCliente.globalChatMessage.findUnique({
      where: { id: messageId },
      select: { id: true, deletedAt: true },
    });
  }

  async listMessages(userId: string, limit: number, cursor?: string) {
    return prismaCliente.globalChatMessage.findMany({
      where: {
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: authorSelect },
        replyTo: {
          select: {
            id: true,
            type: true,
            content: true,
            user: { select: { userHashPublic: true, name: true } },
          },
        },
        reactions: {
          select: { emotion: true, userId: true },
        },
        views: {
          select: {
            userId: true,
            viewedAt: true,
            user: { select: authorSelect },
          },
        },
        _count: { select: { comments: true } },
      },
    });
  }

  async findMessage(messageId: string) {
    return prismaCliente.globalChatMessage.findUnique({
      where: { id: messageId },
      include: {
        user: { select: authorSelect },
        reactions: { select: { emotion: true, userId: true } },
        views: {
          select: {
            userId: true,
            viewedAt: true,
            user: { select: authorSelect },
          },
        },
        _count: { select: { comments: true } },
      },
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    return prismaCliente.globalChatMessage.deleteMany({
      where: { id: messageId, userId },
    });
  }

  async findReaction(messageId: string, userId: string, emotion: string) {
    return prismaCliente.globalChatReaction.findUnique({
      where: { messageId_userId_emotion: { messageId, userId, emotion } },
    });
  }

  async createReaction(messageId: string, userId: string, emotion: string) {
    return prismaCliente.globalChatReaction.create({
      data: { messageId, userId, emotion },
    });
  }

  async deleteReaction(messageId: string, userId: string, emotion: string) {
    return prismaCliente.globalChatReaction.delete({
      where: { messageId_userId_emotion: { messageId, userId, emotion } },
    });
  }

  async createComment(data: {
    messageId: string;
    userId: string;
    content: string;
    replyToId?: string;
  }) {
    return prismaCliente.globalChatComment.create({
      data,
      include: { user: { select: authorSelect } },
    });
  }

  async findComment(commentId: string) {
    return prismaCliente.globalChatComment.findUnique({
      where: { id: commentId },
      select: { id: true, messageId: true },
    });
  }

  async listComments(messageId: string) {
    return prismaCliente.globalChatComment.findMany({
      where: { messageId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: authorSelect } },
    });
  }

  async markViewed(messageId: string, userId: string) {
    await prismaCliente.globalChatMessageView.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: { viewedAt: new Date() },
      create: { messageId, userId },
    });

    return prismaCliente.globalChatMessage.findUnique({
      where: { id: messageId },
      include: {
        user: { select: authorSelect },
        views: {
          where: { userId },
          select: {
            userId: true,
            viewedAt: true,
            user: { select: authorSelect },
          },
        },
      },
    });
  }
}
