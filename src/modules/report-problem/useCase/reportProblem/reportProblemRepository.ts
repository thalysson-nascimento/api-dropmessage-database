import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ReportProblemRepository {
  async getMatchById(matchId: string) {
    return await prisma.match.findUnique({
      where: {
        id: matchId,
      },
    });
  }

  async reportProblem(userId: string, matchId: string, reposrtOption: string) {
    return await prisma.reportProblem.create({
      data: {
        userId: userId,
        matchId: matchId,
        reportProblem: reposrtOption,
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
