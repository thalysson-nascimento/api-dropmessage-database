import { PrismaClient } from "@prisma/client";
import { client } from "../../../../lib/redis";

const prisma = new PrismaClient();
export class CreateSendMessageRepository {
  async getMahctById(matchId: string) {
    return prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        initiator: {
          select: {
            userHashPublic: true,
          },
        },
        recipient: {
          select: {
            userHashPublic: true,
          },
        },
        User: {
          select: {
            userHashPublic: true,
          },
        },
      },
    });
  }

  async createSendMessage(matchId: string, userId: string, content: string) {
    const newMessage = await prisma.message.create({
      data: {
        matchId: matchId,
        userId: userId,
        content: content,
      },
      select: {
        createdAt: true,
        content: true,
        match: {
          select: {
            id: true,
            initiator: {
              select: {
                userHashPublic: true,
              },
            },
            recipient: {
              select: {
                userHashPublic: true,
              },
            },
          },
        },
      },
    });

    const cacheKey = `messages:${matchId}:${userId}:0:10`;
    await client.del(cacheKey);

    // Buscar o cache atual
    // const cacheKey = `messages:${matchId}:${userId}:0:10`; // Exemplo com página 1 (0:10)
    // const cachedMessages = await client.get(cacheKey);

    // if (cachedMessages) {
    //   // Se o cache existe, adicione a nova mensagem ao cache
    //   const { messages, totalMessages } = JSON.parse(cachedMessages);
    //   messages.unshift(newMessage); // Adiciona a nova mensagem no início

    //   // Atualiza o cache no Redis
    //   await client.setEx(
    //     cacheKey,
    //     3600,
    //     JSON.stringify({ messages, totalMessages: totalMessages + 1 })
    //   );
    // } else {
    //   // Se não houver cache, crie um novo
    //   const totalMessages = await prisma.message.count({
    //     where: { matchId },
    //   });

    //   await client.setEx(
    //     cacheKey,
    //     3600,
    //     JSON.stringify({ messages: [newMessage], totalMessages: totalMessages })
    //   );
    // }

    return newMessage;
  }
}
