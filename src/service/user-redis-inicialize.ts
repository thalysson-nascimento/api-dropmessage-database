import { client as redisClient } from "../../src/lib/redis";
import { UserDataEnum } from "../enums/user-data.enum";

export class UserRedisInitializer {
  async initialize(userId: string) {
    const prefix = (key: string) => `${key}:${userId}`;

    const keys = {
      [prefix("countLikePostMessage")]:
        UserDataEnum.FREE_LIKE_LIMIT_POST_MESSAGE.toString(),
      [prefix("mustVideoWatch")]: "false",
      [prefix("userPlanSubscription")]: "free",
      [prefix("userLimiteLikePostMessage")]: "false",
      [prefix("rewardWatchCount")]: "0",
      [prefix("rewardLikesAvailable")]: "0",
    };

    await Promise.all(
      Object.entries(keys).map(([key, value]) =>
        redisClient.set(key, value, { NX: true }),
      ),
    );
    console.log("Chaves Redis criadas para o usuário", userId, keys);
  }
}
