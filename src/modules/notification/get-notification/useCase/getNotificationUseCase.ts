import { PrismaClient } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NotificationTypeEnum } from "../../../../enums/notification.enum";
import { NotificationModel } from "../../../../interfaces/notification.interface";
import { generateAuthenticatedImageUrl } from "../../../../service/cloudinary.service";
import { GetNotificationRepository } from "./getNotificationRepository";

const prisma = new PrismaClient();

export class GetNotificationUseCase {
  private repository = new GetNotificationRepository();

  async execute(userId: string): Promise<NotificationModel[]> {
    const subscription = await prisma.stripeSignature.findFirst({
      where: {
        userId,
        status: {
          in: ["active", "trialing"],
        },
      },
    });

    const isPremium = !!subscription;

    const notifications = await this.repository.findByRecipient(userId);

    return notifications.map((notification) => {
      const avatarPublicId = notification.actor.avatar?.image ?? null;

      const avatarUrl = generateAuthenticatedImageUrl(
        avatarPublicId ?? "",
        isPremium
      );

      const thumbnailUrl = notification.post?.image
        ? generateAuthenticatedImageUrl(notification.post.image, isPremium)
        : null;

      return {
        id: notification.id,
        type: notification.type as NotificationTypeEnum,
        actors: [
          {
            id: notification.actor.id,
            name: notification.actor.name,
            avatarUrl,
          },
        ],
        target: notification.post
          ? {
              id: notification.post.id,
              type: "photo",
              thumbnailUrl,
            }
          : null,
        createdAt: formatDistanceToNow(notification.createdAt, {
          addSuffix: true,
          locale: ptBR,
        }),
        isRead: notification.isRead,
      };
    });
  }
}
