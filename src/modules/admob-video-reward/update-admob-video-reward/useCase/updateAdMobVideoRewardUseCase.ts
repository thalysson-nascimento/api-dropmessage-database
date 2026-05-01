import { UserDataEnum } from "../../../../enums/user-data.enum";
import { client as redisClient } from "../../../../lib/redis";
import { UpdateAdMobVideoRewardRepository } from "./updateAdMobVideoRewardRepository";

export class UpdateAdMobVideoRewardUseCase {
  private repository: UpdateAdMobVideoRewardRepository;

  constructor() {
    this.repository = new UpdateAdMobVideoRewardRepository();
  }
  async execute(userId: string) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const [
      userPlan,
      likeLimitRaw,
      redisTotalLikesRaw,
      mustWatchVideoRaw,
      rewardLikesAvailableRaw,
      rewardWatchCountRaw,
    ] = await Promise.all([
      redisClient.get(`userPlanSubscription:${userId}`),
      redisClient.get(`userLimiteLikePostMessage:${userId}`),
      redisClient.get(`countLikePostMessage:${userId}`),
      redisClient.get(`mustVideoWatch:${userId}`),
      redisClient.get(`rewardLikesAvailable:${userId}`),
      redisClient.get(`rewardWatchCount:${userId}`),
    ]);

    console.log("userPlanSubscription:", userPlan);
    console.log("userLimiteLikePostMessage:", likeLimitRaw);
    console.log("countLikePostMessage:", redisTotalLikesRaw);
    console.log("rewardLikesAvailable:", rewardLikesAvailableRaw);
    console.log("mustVideoWatch:", mustWatchVideoRaw);
    console.log("rewardWatchCount:", rewardWatchCountRaw);
    console.log("==========================");

    const rewardWatchCount =
      rewardWatchCountRaw !== null ? parseInt(rewardWatchCountRaw) : 0;

    if (rewardWatchCount > UserDataEnum.MAX_VIDEO_REWARDS) {
      throw new Error(
        "Video reward limit reached. Please wait 12 hours to reset.",
      );
    }

    // Garante que rewardWatchCount seja um número antes de incrementar
    const rewardWatchCountValue = await redisClient.get(
      `rewardWatchCount:${userId}`,
    );
    if (isNaN(Number(rewardWatchCountValue))) {
      await redisClient.set(`rewardWatchCount:${userId}`, "0");
    }
    const updatedRewardWatchCount = await redisClient.incr(
      `rewardWatchCount:${userId}`,
    );

    // Atualiza userLimiteLikePostMessage com valor fixo
    await redisClient.set(
      `countLikePostMessage:${userId}`,
      UserDataEnum.EXTRA_LIKE_POST_MESSAGE.toString(),
    );

    const result = await this.repository.updateAdMobVideoReward(
      userId,
      UserDataEnum.EXTRA_LIKE_POST_MESSAGE,
      updatedRewardWatchCount,
    );

    return result;
  }
}
