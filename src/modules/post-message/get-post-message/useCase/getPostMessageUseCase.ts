import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class GetPostMessageUseCase {
  async execute(page: number, limit: number) {
    // Definir a URL base para as imagens que agora estarão em /public/upload-posts
    const baseUrl =
      `${process.env.BASE_URL}/upload-posts/` ||
      "http://localhost:3000/upload-posts/";

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
