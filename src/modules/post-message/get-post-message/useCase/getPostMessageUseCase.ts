import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class GetPostMessageUseCase {
  async execute(page: number, limit: number, userId: string) {
    const baseUrl = `${process.env.BASE_URL}/image/post/`;
    const baseUrlAvatar = `${process.env.BASE_URL}/image/user-avatar/`;

    const totalItems = await prisma.postMessageCloudinary.count({
      where: {
        expirationTimer: {
          gt: new Date(),
        },
        userId: {
          not: userId,
        },
        NOT: {
          LikePostMessage: {
            some: {
              userId: userId,
            },
          },
        },
      },
    });

    // Calcular o total de páginas
    const totalPages = Math.ceil(totalItems / limit);

    // Definir o offset para o banco de dados
    const offset = (page - 1) * limit;

    const userPreferences = await prisma.aboutMe.findUnique({
      where: {
        userId: userId, // ID do usuário autenticado
      },
      select: {
        gender: true,
        interests: true,
      },
    });

    if (!userPreferences) {
      throw new Error("User preferences not found.");
    }

    console.log("userPreferences.interests ==>", userPreferences.interests);

    const posts = await prisma.postMessageCloudinary.findMany({
      skip: offset,
      take: limit,
      where: {
        expirationTimer: {
          gt: new Date(),
        },
        isExpired: false,
        userId: {
          not: userId,
        },
        NOT: {
          LikePostMessage: {
            some: {
              userId: userId,
            },
          },
        },
        user: {
          isDeactivated: false,
          About: {
            OR:
              userPreferences.interests === "ambos"
                ? [{ gender: "homem" }, { gender: "mulher" }]
                : { gender: userPreferences.interests },
          },
        },
      },
      select: {
        id: true,
        image: true,
        expirationTimer: true,
        typeExpirationTimer: true,
        user: {
          select: {
            UserLocation: {
              select: {
                city: true,
                stateCode: true,
              },
            },
            name: true,
            avatar: {
              select: {
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Modificar a chave "image" para incluir o caminho completo
    const postsWithFullImagePath = posts.map((post: any) => ({
      ...post,
      image: `${baseUrl}${post.image}`,
      user: {
        name: post.user.name,
        avatar: `${baseUrlAvatar}${post.user.avatar.image}`,
        city: post.user.UserLocation.city,
        stateCode: post.user.UserLocation.stateCode,
      },
    }));

    // Verificar se é a última página e adicionar o objeto extra apenas nessa página
    if (page === totalPages || (page === 1 && totalPages === 0)) {
      postsWithFullImagePath.push({
        id: "no-matches",
        image: "lottie-icon-no-match",
        expirationTimer: "",
        typeExpirationTimer: "",
      });
    }

    // Retornar a estrutura desejada
    return {
      currentPage: page,
      totalPages,
      perPage: limit,
      totalItems,
      data: postsWithFullImagePath,
    };
  }
}
