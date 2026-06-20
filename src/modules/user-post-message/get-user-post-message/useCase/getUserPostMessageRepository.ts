import { PrismaClient } from "@prisma/client";
import { formatDistanceToNowStrict } from "date-fns";
import { getImageUrl } from "../../../../service/cloudinary.service";

const prisma = new PrismaClient();

export class GetPostMessageRepository {
  async getUserPostMessage(page: number, limit: number, userId: string) {
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
        expirationTimer: true,
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
        image: getImageUrl(userPostMessage.image),
        createdAt: formatDistanceToNowStrict(
          new Date(userPostMessage.createdAt),
          {
            addSuffix: true,
          },
        ),
        updatedAt: formatDistanceToNowStrict(
          new Date(userPostMessage.updatedAt),
          {
            addSuffix: true,
          },
        ),
        typeExpirationTimer: userPostMessage.typeExpirationTimer,
        isExpired: checkIsExpired(userPostMessage.expirationTimer),
        totalLikes: userPostMessage._count.LikePostMessage, // Extrair apenas o valor desejado
      }),
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

function checkIsExpired(expirationDate: Date | string | number): boolean {
  const now = new Date();
  const expiration = new Date(expirationDate);

  // Garante que a data convertida é válida antes de comparar
  if (isNaN(expiration.getTime())) {
    throw new Error("Data de expiração inválida");
  }

  return expiration < now;
}
