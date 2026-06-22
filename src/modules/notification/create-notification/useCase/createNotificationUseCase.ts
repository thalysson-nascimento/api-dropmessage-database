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
  }) {
    if (data.notifiedUserId === data.actorId) return;

    const notification = await this.repository.create(data);

    const io = getSocketIO();

    io.to(data.notifiedUserId).emit("notification:new", {
      notificationId: notification.id,
    });

    const unreadCount = await this.repository.countUnread(data.notifiedUserId);

    io.to(data.notifiedUserId).emit("notification:unread", {
      count: unreadCount,
      hasUnread: unreadCount > 0,
    });

    return notification;
  }
}
