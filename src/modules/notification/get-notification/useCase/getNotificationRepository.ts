import { NotificationType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class GetNotificationRepository {
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

  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async countUnread(notifiedUserId: string) {
    return prisma.notification.count({
      where: {
        notifiedUserId,
        isRead: false,
      },
    });
  }
}
