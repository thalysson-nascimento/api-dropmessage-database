import { PrismaClient } from "@prisma/client";
import { client as redisClient } from "../../../../lib/redis";

const EXPIRATION_TIME = 12 * 60 * 60; // 12 horas em segundos
const VIDEO_REWARD_LIKE_AMOUNT = 4;
const MAX_VIDEO_REWARDS = 5;

export class UpdateAdMobVideoRewardRepository {
  private prisma = new PrismaClient();

  async updateAdMobVideoReward(userId: string) {
    const existingRecord = await this.prisma.rewardTracking.findUnique({
      where: {
        userId,
      },
    });

    if (!existingRecord) {
      throw new Error("Dados do usuário não encontrado.");
    }

    if (
      existingRecord.rewardWatchCount >= MAX_VIDEO_REWARDS &&
      existingRecord.rewardLikesAvailable === 0
    ) {
      throw new Error(
        "Limite de recompensas de vídeo atingido. Aguarde 12 horas para reiniciar.",
      );
    }

    const nextRewardWatchCount = Math.min(
      existingRecord.rewardWatchCount + 1,
      MAX_VIDEO_REWARDS,
    );

    const nextState = {
      mustWatchVideo: false,
      totalLikes: 0,
      rewardWatchCount: nextRewardWatchCount,
      rewardLikesAvailable:
        existingRecord.rewardLikesAvailable + VIDEO_REWARD_LIKE_AMOUNT,
      limitReached: false,
      cycleExpiresAt: existingRecord.cycleExpiresAt
        ? new Date(existingRecord.cycleExpiresAt)
        : null,
    };

    if (!nextState.cycleExpiresAt || new Date() > nextState.cycleExpiresAt) {
      nextState.cycleExpiresAt = new Date(Date.now() + EXPIRATION_TIME * 1000);
    }

    const redisKeyMustVideoWatch = `mustVideoWatch:${userId}`;
    const countLikePostMessage = `countLikePostMessage:${userId}`;
    const rewardLikesAvailableKey = `rewardLikesAvailable:${userId}`;
    const rewardWatchCountKey = `rewardWatchCount:${userId}`;
    const userLimitKey = `userLimiteLikePostMessage:${userId}`;
    const cycleExpiresAtKey = `cycleExpiresAt:${userId}`;

    const ttl = Math.max(
      0,
      Math.floor((nextState.cycleExpiresAt.getTime() - Date.now()) / 1000),
    );

    await Promise.all([
      redisClient.set(redisKeyMustVideoWatch, "false"),
      redisClient.set(countLikePostMessage, "0"),
      redisClient.set(
        rewardLikesAvailableKey,
        String(nextState.rewardLikesAvailable),
      ),
      redisClient.set(rewardWatchCountKey, String(nextRewardWatchCount)),
      redisClient.set(userLimitKey, String(false)),
      redisClient.set(
        cycleExpiresAtKey,
        nextState.cycleExpiresAt.toISOString(),
      ),
      redisClient.expire(redisKeyMustVideoWatch, ttl),
      redisClient.expire(countLikePostMessage, ttl),
      redisClient.expire(rewardLikesAvailableKey, ttl),
      redisClient.expire(rewardWatchCountKey, ttl),
      redisClient.expire(userLimitKey, ttl),
      redisClient.expire(cycleExpiresAtKey, ttl),
    ]);

    console.log(
      "atualizando status de assistir o video",
      redisKeyMustVideoWatch,
    );

    return await this.prisma.rewardTracking.update({
      where: {
        userId,
      },
      data: {
        mustWatchVideoReword: false,
        totalLikes: 0,
        rewardWatchCount: nextRewardWatchCount,
        rewardLikesAvailable: nextState.rewardLikesAvailable,
        limitReached: false,
        cycleExpiresAt: nextState.cycleExpiresAt,
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
