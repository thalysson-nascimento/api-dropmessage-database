import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class LastLikePostMessageRepository {
  async lastLikePostMessage(userId: string) {
    return await prisma.likePostMessage.findFirst({
      where: {
        PostMessageCloudinary: {
          userId: userId, // Filtra os posts criados pelo usuário passado
        },
      },
      orderBy: {
        createdAt: "desc", // Ordena por data de criação, pegando o mais recente
      },
      select: {
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
  }

  async totalLikeMessage(userId: string) {
    return await prisma.likePostMessage.count({
      where: {
        PostMessageCloudinary: {
          userId: userId,
        },
      },
    });
  }
}
