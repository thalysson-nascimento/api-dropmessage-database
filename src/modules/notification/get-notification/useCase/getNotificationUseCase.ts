import { PrismaClient } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const prisma = new PrismaClient();

export class GetNotificationUseCase {
  async execute(userId: string) {
    const notifications = await prisma.likePostMessage.findMany({
      where: {
        post: {
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
        post: {
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
              ? `${process.env.BASE_URL}/image/user-avatar/${notification.user.avatar.image}`
              : null,
        },
        post: {
          ...notification.post,
          image: `${process.env.BASE_URL}/image/post/${notification.post.image}`,
        },
      };
    });

    return notificationsWithPathImage;
  }
}
