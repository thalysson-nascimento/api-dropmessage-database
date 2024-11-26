import { PrismaClient } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const prisma = new PrismaClient();

export class GetNotificationUseCase {
  async execute(userId: string) {
    const notifications = await prisma.likePostMessage.findMany({
      where: {
        PostMessageCloudinary: {
          userId: {
            equals: userId,
          },
        },
      },
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            avatar: {
              select: {
                image: true,
              },
            },
          },
        },
        PostMessageCloudinary: {
          select: {
            id: true,
            createdAt: true,
            image: true,
          },
        },
      },
    });

    const notificationsWithPathImage = notifications.map((notification) => {
      return {
        ...notification,
        createdAt: formatDistanceToNow(new Date(notification.createdAt), {
          addSuffix: true,
          locale: ptBR,
        }),

        user: {
          ...notification.user,
          avatar:
            notification.user?.avatar && notification.user.avatar.image
              ? notification.user.avatar.image
              : null,
        },
        post: {
          ...notification.PostMessageCloudinary,
          image: notification.PostMessageCloudinary?.image,
        },
      };
    });

    return notificationsWithPathImage;
  }
}
