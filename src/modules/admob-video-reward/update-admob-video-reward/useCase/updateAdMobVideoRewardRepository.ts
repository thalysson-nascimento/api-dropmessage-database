import { PrismaClient } from "@prisma/client";

export class UpdateAdMobVideoRewardRepository {
  private prisma = new PrismaClient();

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async updateAdMobVideoReward(
    userId: string,
    accountLikePostMessage: number,
    updatedRewardWatchCount: number,
  ) {
    return await this.prisma.rewardTracking.update({
      where: {
        userId,
      },
      data: {
        mustWatchVideoReword: false,
        totalLikes: accountLikePostMessage,
        rewardWatchCount: updatedRewardWatchCount,
        limitReached: false,
      },
      select: {
        updatedAt: true,
        mustWatchVideoReword: true,
        totalLikes: true,
        rewardWatchCount: true,
        rewardLikesAvailable: true,
        limitReached: true,
        cycleExpiresAt: true,
      },
    });
  }
}
