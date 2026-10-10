import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class GetSendMessageRepository {
  async getMatchWithUsers(matchId: string) {
    return prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        initiatorId: true,
        recipientId: true,
        unMatch: true,
        initiator: {
          select: {
            id: true,
            userHashPublic: true,
            name: true,
            avatar: { select: { image: true, version: true } },
          },
        },
        recipient: {
          select: {
            id: true,
            userHashPublic: true,
            name: true,
            avatar: { select: { image: true, version: true } },
          },
        },
      },
    });
  }

  async getMessages(matchId: string, skip: number, take: number) {
    const messages = await prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        content: true,
        image: true,
        fileName: true,
        format: true,
        viewOnce: true,
        createdAt: true,
        views: { select: { userId: true } },
        user: {
          select: {
            id: true,
            userHashPublic: true,
            name: true,
            avatar: {
              select: { image: true, version: true },
            },
          },
        },
      },
    });

    return messages.reverse();
  }

  async countMessages(matchId: string) {
    return prisma.message.count({
      where: { matchId },
    });
  }

  async getOnlineStatus(userId: string) {
    return prisma.loggedUsers.findUnique({
      where: { userId },
      select: {
        isOnline: true,
        lastSeen: true,
      },
    });
  }
}
