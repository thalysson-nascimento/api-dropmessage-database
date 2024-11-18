/*************  ✨ Codeium Command 🌟  *************/
import { PrismaClient } from "@prisma/client";

export class ListChatRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getChats(userId: string) {
    return this.prisma.match.findMany({
      where: {
        OR: [{ initiatorId: userId }, { recipientId: userId }],
      },
      select: {
        id: true,
        initiatorId: true,
        recipientId: true,
        initiator: {
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
        recipient: {
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
  }
}

/******  c2abd9d3-0a72-4423-956a-4c17041a15de  *******/
