import { PrismaClient } from "@prisma/client";
import { client as redisClient } from "../../../../lib/redis";

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

    const redisKeyCountLikePostMessage = `countLikePostMessage:${userId}`;
    const redisKeyMustVideoWatch = `mustVideoWatch:${userId}`;
    await redisClient.set(redisKeyCountLikePostMessage, "0");
    await redisClient.set(redisKeyMustVideoWatch, "false");

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
