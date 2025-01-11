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
