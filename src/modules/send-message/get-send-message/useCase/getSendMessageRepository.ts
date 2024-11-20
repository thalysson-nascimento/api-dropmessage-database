import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class GetSendMessageRepository {
  async getMahctById(matchId: string) {
    return prisma.match.findUnique({
      where: {
        id: matchId,
      },
    });
  }

  async getMessagesByMatchId(
    matchId: string,
    userId: string,
    skip: number,
    take: number
  ) {
    // Verifica o userHashPublic do usuário que está fazendo a requisição
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userHashPublic: true },
    });

    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    // Conta o total de mensagens para o matchId
    const totalMessages = await prisma.message.count({
      where: { matchId },
    });

    // Busca mensagens com paginação
    const messages = await prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        createdAt: true,
        content: true,
        user: {
          select: {
            userHashPublic: true,
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

    return { messages, totalMessages };
  }
}
