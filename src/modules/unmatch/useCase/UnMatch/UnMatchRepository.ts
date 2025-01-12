import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class UnMatchRepository {
  async getMatchById(matchId: string) {
    return await prisma.match.findUnique({
      where: {
        id: matchId,
      },
    });
  }

  async userUnMatch(matchId: string) {
    return await prisma.match.update({
      where: {
        id: matchId,
      },
      data: {
        unMatch: true,
      },
      select: {
        unMatch: true,
      },
    });
  }
}
