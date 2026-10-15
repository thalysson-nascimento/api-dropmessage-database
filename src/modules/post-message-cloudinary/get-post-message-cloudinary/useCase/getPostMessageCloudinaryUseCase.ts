import { UserDataEnum } from "../../../../enums/user-data.enum";
import { FeedPostCard } from "../../../../interfaces/feed.interface";
import { client as redisClient } from "../../../../lib/redis";
import { getImageUrl } from "../../../../service/cloudinary.service";
import { GetPostMessageCloudinaryRepository } from "./getPostMessageCloudinaryRepository";

export class GetPostMessageCloudinaryUseCase {
  private repository = new GetPostMessageCloudinaryRepository();

  async execute(userId: string, page: number, limit: number) {
    const [userData, rewardWatchCountRaw] = await Promise.all([
      this.repository.getUserData(userId),
      redisClient.get(`rewardWatchCount:${userId}`),
    ]);
    const interests = userData?.About?.interests ?? "both";
    const status = userData?.StripeSignature[0]?.status;
    const isSubscriber = !!status && ["active", "trialing", "past_due"].includes(status);
    const { totalItems, posts } = await this.repository.findPostsWithCount(
      userId, interests, (page - 1) * limit, limit,
    );

    // Viewing the feed is independent of the quota enforced by the like endpoint.
    const items: FeedPostCard[] = posts.map(post => ({
      ...post,
      type: ["POST"],
      image: post.image ? getImageUrl(post.image) : "",
      user: {
        ...post.user,
        avatar: { image: post.user.avatar?.image ? getImageUrl(post.user.avatar.image) : "" },
        UserLocation: {
          city: isSubscriber ? post.user.UserLocation?.city ?? null : null,
          stateCode: isSubscriber ? post.user.UserLocation?.stateCode ?? null : null,
          countryCode: post.user.UserLocation?.countryCode ?? null,
        },
      },
    }));

    const rewardWatchCount = Number(rewardWatchCountRaw ?? 0);
    const canWatchReward = !isSubscriber && posts.length > 0 &&
      Number.isInteger(rewardWatchCount) && rewardWatchCount >= 0 &&
      rewardWatchCount < UserDataEnum.MAX_VIDEO_REWARDS;
    items.push(canWatchReward
      ? { type: ["WATCH_VIDEO", "AI_SUGGESTION"] }
      : { type: ["AI_SUGGESTION"] });

    return { page, totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      totalItems, interests, type: ["POST"], items };
  }
}
