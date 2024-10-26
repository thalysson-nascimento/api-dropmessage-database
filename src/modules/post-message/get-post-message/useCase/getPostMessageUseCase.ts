import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class GetPostMessageUseCase {
  async execute(page: number, limit: number) {
    // Definir a URL base para as imagens que agora estarão em /image/post
    const baseUrl = `${process.env.BASE_URL}/image/post/`;

    // Calcular o total de posts
    const totalItems = await prisma.postMessage.count({
      where: {
        expirationTimer: {
          gt: new Date(),
        },
      },
    });

    // Calcular o total de páginas
    const totalPages = Math.ceil(totalItems / limit);

    // Definir o offset para o banco de dados
    const offset = (page - 1) * limit;

    // Buscar os posts com a paginação
    const posts = await prisma.postMessage.findMany({
      skip: offset,
      take: limit,
      where: {
        expirationTimer: {
          gt: new Date(),
        },
        isExpired: false,
      },
      select: {
        id: true,
        image: true,
        expirationTimer: true,
        typeExpirationTimer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Modificar a chave "image" para incluir o caminho completo
    const postsWithFullImagePath = posts.map((post: any) => ({
      ...post,
      image: `${baseUrl}${post.image}`, // Concatenar a URL base com o nome da imagem
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
