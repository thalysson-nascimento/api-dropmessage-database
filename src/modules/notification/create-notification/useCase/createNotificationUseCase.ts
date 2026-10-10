import { NotificationType } from "@prisma/client";
import { getSocketIO } from "../../../../lib/socket";
import { GetNotificationRepository } from "../../get-notification/useCase/getNotificationRepository";

export class CreateNotificationUseCase {
  private repository = new GetNotificationRepository();

  async execute(data: {
    notifiedUserId: string;
    actorId: string;
    type: NotificationType;
    postId?: string;
    matchId?: string;
    messageId?: string;
    globalChatMessageId?: string;
    commentText?: string;
    emotion?: string;
  }) {
    if (data.notifiedUserId === data.actorId) return;

    const notification = await this.repository.create(data);

    await this.notifyRecipient(notification);
    return notification;
  }

  async notifyRecipient(notification: { id: string; notifiedUserId: string }) {
    try {
      const io = getSocketIO();

      io.to(notification.notifiedUserId).emit("notification:new", {
        notificationId: notification.id,
      });

      const unreadCount = await this.repository.countUnread(notification.notifiedUserId);

      io.to(notification.notifiedUserId).emit("notification:unread", {
        count: unreadCount,
        hasUnread: unreadCount > 0,
      });

    } catch {
      console.error("Falha ao emitir notificação em tempo real", { notificationId: notification.id });
    }
    return notification;
  }
}
