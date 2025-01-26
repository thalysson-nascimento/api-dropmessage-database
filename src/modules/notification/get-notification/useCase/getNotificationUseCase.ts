import { PrismaClient } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const prisma = new PrismaClient();

export class GetNotificationUseCase {
  async execute(userId: string) {
    let blurLevel: string;
    let showName: boolean = false;

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
      },
    });

    const userSubscription = await prisma.stripeSignature.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!userSubscription?.plan || userSubscription?.status === "canceled") {
      blurLevel = "/e_blur:2000";
    } else {
      blurLevel = "";
      showName = true;
    }

    const notificationsWithPathImage = notifications.map((notification) => {
      return {
        ...notification,
        createdAt: formatDistanceToNow(new Date(notification.createdAt), {
          addSuffix: true,
          locale: ptBR,
        }),
        user: {
          ...notification.user,
          avatar: notification.user?.avatar
            ? this.addBlurToImage(notification.user.avatar.image, blurLevel)
            : null,
          name: showName ? notification.user.name : null,
        },
      };
    });

    return notificationsWithPathImage;
  }

  private addBlurToImage(imageUrl: string, blurLevel: string): string {
    if (!imageUrl) return imageUrl; // Verifica se a URL existe

    const parts = imageUrl.split("/upload/"); // Divide a URL antes e depois de "upload"
    if (parts.length === 2) {
      return `${parts[0]}/upload${blurLevel}/${parts[1]}`;
    }

    return imageUrl; // Retorna a URL original caso não seja possível dividir
  }
}
