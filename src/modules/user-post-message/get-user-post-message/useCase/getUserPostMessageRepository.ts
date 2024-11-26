import { PrismaClient } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const prisma = new PrismaClient();

export class GetPostMessageRepository {
  async getUserPostMessage(page: number, limit: number, userId: string) {
    const baseUrl = `${process.env.BASE_URL}/image/post/`;

    const totalItems = await prisma.postMessageCloudinary.count({
      where: {
        userId: userId,
      },
    });

    // Calcular o total de páginas
    const totalPages = Math.ceil(totalItems / limit);

    // Definir o offset para o banco de dados
    const offset = (page - 1) * limit;

    const userPostMessages = await prisma.postMessageCloudinary.findMany({
      skip: offset,
      take: limit,
      where: {
        userId: userId,
      },
      select: {
        id: true,
        image: true,
        createdAt: true,
        typeExpirationTimer: true,
        isExpired: true,
        updatedAt: true,
        _count: {
          select: {
            LikePostMessage: true, // Contar o total de curtidas
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const userPostMessagesWithPathImage = userPostMessages.map(
      (userPostMessage) => ({
        id: userPostMessage.id,
        image: `${baseUrl}/${userPostMessage.image}`,
        createdAt: formatDistanceToNow(new Date(userPostMessage.createdAt), {
          addSuffix: true,
          locale: ptBR,
        }),
        updatedAt: formatDistanceToNow(new Date(userPostMessage.updatedAt), {
          addSuffix: true,
          locale: ptBR,
        }),
        typeExpirationTimer: userPostMessage.typeExpirationTimer,
        isExpired: userPostMessage.isExpired,
        totalLikes: userPostMessage._count.LikePostMessage, // Extrair apenas o valor desejado
      })
    );

    return {
      currentPage: page,
      totalPages,
      perPage: limit,
      totalItems,
      userPostMessages: userPostMessagesWithPathImage,
    };
  }
}
