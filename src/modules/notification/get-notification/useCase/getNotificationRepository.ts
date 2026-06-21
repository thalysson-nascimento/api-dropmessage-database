import { NotificationType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class GetNotificationRepository {
  // ✅ CREATE
  async create(data: {
    notifiedUserId: string;
    actorId: string;
    type: NotificationType;
    postId?: string;
    matchId?: string;
    messageId?: string;
  }) {
    return prisma.notification.create({
      data,
    });
  }

  // ✅ LIST NOTIFICATIONS
  async findByRecipient(notifiedUserId: string) {
    return prisma.notification.findMany({
      where: {
        notifiedUserId,
      },
      include: {
        actor: {
          include: {
            avatar: true,
          },
        },
        post: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // ✅ MARK AS READ
  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  // ✅ COUNT UNREAD
  async countUnread(notifiedUserId: string) {
    return prisma.notification.count({
      where: {
        notifiedUserId,
        isRead: false,
      },
    });
  }

  // ✅ STRIPE (ISOLADO NO REPOSITORY)
  async findActiveSubscription(userId: string) {
    return prisma.stripeSignature.findFirst({
      where: {
        userId,
        status: {
          in: ["active", "trialing"],
        },
      },
    });
  }

  // ✅ MATCH EM LOTE (CORRETO PARA SEU SCHEMA)
  async findMatchesBetweenUsers(userId: string, actorIds: string[]) {
    return prisma.match.findMany({
      where: {
        unMatch: false,
        OR: [
          {
            initiatorId: userId,
            recipientId: { in: actorIds },
          },
          {
            initiatorId: { in: actorIds },
            recipientId: userId,
          },
        ],
      },
      include: {
        initiator: {
          include: {
            avatar: true,
            UserLocation: true,
          },
        },
        recipient: {
          include: {
            avatar: true,
            UserLocation: true,
          },
        },
      },
    });
  }

  // ✅ COMENTARIOS EM LOTE PARA NOTIFICACOES
  async findCommentsForNotifications(postIds: string[], actorIds: string[]) {
    return prisma.commentPostMessage.findMany({
      where: {
        postId: { in: postIds },
        userId: { in: actorIds },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
