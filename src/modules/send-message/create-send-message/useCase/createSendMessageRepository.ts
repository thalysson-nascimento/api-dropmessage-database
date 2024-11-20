import { PrismaClient } from "@prisma/client";

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
    return prisma.message.create({
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
  }
}
