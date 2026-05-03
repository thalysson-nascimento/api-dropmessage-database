import { UserDataEnum } from "../../../../enums/user-data.enum";
import { FeedPostCard } from "../../../../interfaces/feed.interface";
import { client as redisClient } from "../../../../lib/redis";
import { getImageUrl } from "../../../../service/cloudinary.service";
import { GetPostMessageCloudinaryRepository } from "./getPostMessageCloudinaryRepository";

export class GetPostMessageCloudinaryUseCase {
  // Constantes de controle de regras
  private static readonly FREE_LIKE_LIMIT =
    UserDataEnum.FREE_LIKE_LIMIT_POST_MESSAGE; // Limite de curtidas grátis

  private repository = new GetPostMessageCloudinaryRepository();

  async execute(userId: string, page: number, limit: number) {
    // Busca dados do usuário
    const userData = await this.repository.getUserData(userId);
    const suguinature = await this.repository.findSiguinatureByUserId(userId);
    const interests = userData?.About?.interests ?? "both";

    // Busca valores do Redis com fallback
    const [redisTotalLikesRaw, rewardLikesAvailableRaw, rewardWatchCountRaw] =
      await Promise.all([
        redisClient.get(`countLikePostMessage:${userId}`),
        redisClient.get(`rewardLikesAvailable:${userId}`),
        redisClient.get(`rewardWatchCount:${userId}`),
      ]);

    const rewardLikesAvailable =
      rewardLikesAvailableRaw !== null ? Number(rewardLikesAvailableRaw) : 0;
    const rewardWatchCount =
      rewardWatchCountRaw !== null ? rewardWatchCountRaw : "0";
    let totalLikes =
      redisTotalLikesRaw !== null
        ? Number(redisTotalLikesRaw)
        : GetPostMessageCloudinaryUseCase.FREE_LIKE_LIMIT;

    // Soma curtidas de recompensa, se houver
    let availableLikes = totalLikes + rewardLikesAvailable;
    const isSubscriber = this.isActiveSubscription(suguinature?.status);

    // Busca posts
    const offset = (page - 1) * limit;
    const { totalItems, posts } = await this.repository.findPostsWithCount(
      userId,
      interests,
      offset,
      limit,
    );
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    // 🔢 limita quantidade de posts que podem ser curtidos
    const allowedPosts = isSubscriber ? posts : posts.slice(0, availableLikes);

    // 🔄 monta apenas os posts válidos
    const formattedPosts: FeedPostCard[] = allowedPosts.map((post) => {
      const avatarPublicId = post.user.avatar?.image;
      const avatarImage = avatarPublicId ? getImageUrl(avatarPublicId) : "";
      const postImage = post.image ? getImageUrl(post.image) : "";

      return {
        ...post,
        type: ["POST"],
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

    console.log("Total de posts:", posts.length);

    // !isSubscriber siguinifica que é free pois nao tem nem uma das opções dentro
    // do metodo
    if (!isSubscriber) {
      if (
        rewardWatchCount < UserDataEnum.MAX_VIDEO_REWARDS.toString() &&
        posts.length > UserDataEnum.MINIMO_POST_MESSAGE_SHOW_VIDEO_REWARD
      ) {
        formattedPosts.push({
          type: ["WATCH_VIDEO", "AI_SUGGESTION"],
        } as unknown as FeedPostCard);
      } else {
        formattedPosts.push({
          type: ["AI_SUGGESTION"],
        } as unknown as FeedPostCard);
      }
    } else {
      formattedPosts.push({
        type: ["AI_SUGGESTION"],
      } as unknown as FeedPostCard);
    }

    return {
      page,
      totalPages,
      totalItems,
      interests,
      type: ["POST"],
      items: formattedPosts,
    };
  }

  private isActiveSubscription(status: string | undefined): boolean {
    if (!status) return false;
    return ["active", "trialing", "past_due"].includes(status);
  }
}
