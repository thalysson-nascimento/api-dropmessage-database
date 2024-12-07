import { PrismaClient } from "@prisma/client";

export class UpdateAdMobVideoRewardRepository {
  private prisma = new PrismaClient();

  async updateAdMobVideoReward(userId: string) {
    const existingRecord = await this.prisma.rewardTracking.findUnique({
      where: {
        userId: userId,
      },
    });

    if (!existingRecord) {
      throw new Error("Dados do usuário não encontrado.");
    }

    return await this.prisma.rewardTracking.update({
      where: {
        userId: userId,
      },
      data: {
        mustWatchVideoReword: false,
        totalLikes: 0,
      },
      select: {
        updatedAt: true,
        mustWatchVideoReword: true,
        totalLikes: true,
      },
    });
  }
}
