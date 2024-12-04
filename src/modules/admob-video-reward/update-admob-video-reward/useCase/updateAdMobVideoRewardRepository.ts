import { PrismaClient } from "@prisma/client";

export class UpdateAdMobVideoRewardRepository {
  private prisma = new PrismaClient();

  async updateAdMobVideoReward(userId: string) {
    return await this.prisma.rewardTracking.update({
      where: {
        userId: userId,
      },
      data: {
        mustWatchVideoReword: false,
        totalLikes: 0,
      },
    });
  }
}
