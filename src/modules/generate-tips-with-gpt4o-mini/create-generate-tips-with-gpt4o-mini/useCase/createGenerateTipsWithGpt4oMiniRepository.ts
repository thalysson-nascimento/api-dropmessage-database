import { PrismaClient } from "@prisma/client";
import { openAIClient } from "../../../../lib/openAIGptMini";

const prisma = new PrismaClient();

export class CreateGenerateTipsWithGpt4oMiniRepository {
  async createGenerateTipsWithGpt4oMini(
    userDescription: string,
    filterMatchedUserDescription: string
  ) {
    const stream = await openAIClient.chat.completions.create({
      model: "gpt-4o-mini",
      store: true,
      messages: [
        {
          role: "system",
          content:
            "Com base nas duas descrições que foram passadas retorna 5 dicas de iniciar uma conversa para um chat de relacionamento, as dicas devem ter no minimo 15 caracteres e no maximo 20 caracteres, não precisa retornar nem uma formalidade, retorne em formato de array [] separando as tips por virgula dentro do array. Seja mais informau que possivel.",
        },
        {
          role: "user",
          content: `Descricão: ${userDescription} \nDescricão do outro usuário: ${filterMatchedUserDescription}`,
        },
      ],
    });

    const content = stream.choices[0]?.message?.content;

    if (!content) {
      throw new Error("O conteúdo retornado pela API está vazio.");
    }

    return JSON.parse(content);
  }

  async getMatchById(matchId: string) {
    return prisma.match.findUnique({
      where: {
        id: matchId,
      },
    });
  }

  async getUserDescription(userId: string) {
    return prisma.userDescription.findFirst({
      where: {
        userId: {
          equals: userId,
        },
      },
      select: {
        description: true,
      },
    });
  }

  async findMatchedUserDescription(userId: string, matchId: string) {
    const matchedUser = await prisma.match.findUnique({
      where: {
        id: matchId,
      },
      select: {
        initiatorId: true,
        recipientId: true,
      },
    });

    if (!matchedUser) {
      throw new Error("Match não encontrado.");
    }

    // Identifica o outro usuário
    const otherUserId =
      matchedUser.initiatorId === userId
        ? matchedUser.recipientId
        : matchedUser.initiatorId;

    const matchedUserDescription = await prisma.userDescription.findFirst({
      where: {
        userId: {
          equals: otherUserId, // Usa o ID do outro usuário
        },
      },
      select: {
        description: true,
      },
    });

    return matchedUserDescription;
  }
}
