import { FeedPostCard } from "../../../../interfaces/feed.interface";
import { client as redisClient } from "../../../../lib/redis";
import { getImageUrl } from "../../../../service/cloudinary.service";
import { GetPostMessageCloudinaryRepository } from "./getPostMessageCloudinaryRepository";

export class GetPostMessageCloudinaryUseCase {
  private repository = new GetPostMessageCloudinaryRepository();

  private isActiveSubscription(status?: string) {
    if (!status) return false;

    return ["active", "trialing", "past_due"].includes(status);
  }

  async execute(userId: string, page: number, limit: number) {
    const userData = await this.repository.getUserData(userId);

    const interests = userData?.About?.interests ?? "ambos";

    const subscriptionStatus = userData?.StripeSignature?.[0]?.status;

    const isSubscriber = this.isActiveSubscription(subscriptionStatus);

    // LIMIT LIKE

    const likeLimit = await redisClient.get(
      `userLimiteLikePostMessage:${userId}`,
    );

    if (likeLimit === "true") {
      return {
        page,
        totalPages: 0,
        totalItems: 0,
        type: "LIKE_LIMIT",
        posts: [],
      };
    }

    // WATCH VIDEO

    const mustWatchVideo = await redisClient.get(`mustVideoWatch:${userId}`);

    const plan = await redisClient.get(`userPlanSubscription:${userId}`);

    if (mustWatchVideo === "true" && plan === "free") {
      return {
        page,
        totalPages: 0,
        totalItems: 0,
        type: "WATCH_VIDEO",
        posts: [],
      };
    }

    const offset = (page - 1) * limit;

    const { totalItems, posts } = await this.repository.findPostsWithCount(
      userId,
      interests,
      offset,
      limit,
    );

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    const formattedPosts: FeedPostCard[] = posts.map((post) => {
      const avatarPublicId = post.user.avatar?.image;
      const avatarImage = avatarPublicId ? getImageUrl(avatarPublicId) : "";
      const postImage = post.image ? getImageUrl(post.image) : "";

      return {
        ...post,
        type: "POST",
        image: postImage,
        user: {
          ...post.user,
          UserLocation: isSubscriber
            ? (post.user.UserLocation ?? { city: null, stateCode: null })
            : { city: null, stateCode: null },
          avatar: { image: avatarImage || "" },
        },
      };
    });

    if (formattedPosts.length === 0) {
      return {
        page,
        totalPages,
        totalItems,
        interests,
        type: "AI_SUGGESTION",
        posts: [],
      };
    }

    if (page >= totalPages) {
      formattedPosts.push({
        type: "AI_SUGGESTION",
      } as FeedPostCard);
    }

    return {
      page,
      totalPages,
      totalItems,
      interests,
      type: "POST",
      items: formattedPosts,
    };
  }
}
