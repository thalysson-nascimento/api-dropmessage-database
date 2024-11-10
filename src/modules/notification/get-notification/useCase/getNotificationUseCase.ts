import { PrismaClient } from "@prisma/client";

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
        userId: true,
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
            expirationTimer: true,
            userId: true,
            image: true,
          },
        },
      },
    });

    const notificationsWithPathImage = notifications.map((notification) => {
      return {
        ...notification,
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
