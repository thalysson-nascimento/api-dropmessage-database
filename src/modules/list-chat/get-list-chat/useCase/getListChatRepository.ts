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
        unMatch: false,
      },
      select: {
        id: true,
        initiatorId: true,
        recipientId: true,
        Message: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            content: true,
            createdAt: true,
          },
        },
        initiator: {
          select: {
            UserLocation: {
              select: {
                stateCode: true,
                city: true,
              },
            },
            // userHashPublic: true,
            isDeactivated: false,
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
            UserLocation: {
              select: {
                stateCode: true,
                city: true,
              },
            },
            // userHashPublic: true,
            isDeactivated: false,
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
