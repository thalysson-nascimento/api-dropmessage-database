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

    const redisKeyMustVideoWatch = `mustVideoWatch:${userId}`;
    await redisClient.set(redisKeyMustVideoWatch, "false");
    const countLikePostMessage = `countLikePostMessage:${userId}`;
    await redisClient.set(countLikePostMessage, "0");

    console.log(
      "atualizando status de assistir o video",
      redisKeyMustVideoWatch
    );

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
