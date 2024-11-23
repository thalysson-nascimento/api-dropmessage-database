import { PrismaClient } from "@prisma/client";
import { client } from "../../../../lib/redis";

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

    const cacheKey = `messages:${matchId}:${userId}:${skip}:${take}`;

    console.log("Cache Key:", cacheKey);

    client.on("connect", () => {
      console.log("Redis conectado!");
    });

    client.on("error", (err) => {
      console.log("Erro de conexão com o Redis:", err);
    });

    // Tenta pegar as mensagens do cache
    const cachedMessages = await client.get(cacheKey);

    if (cachedMessages) {
      // Se encontrar no cache, retorna as mensagens em formato JSON
      console.log("PEGANDO DO REDIS ===>");
      return JSON.parse(cachedMessages);
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

    await client.setEx(
      cacheKey,
      3600,
      JSON.stringify({ messages, totalMessages })
    );

    return { messages, totalMessages };
  }
}
