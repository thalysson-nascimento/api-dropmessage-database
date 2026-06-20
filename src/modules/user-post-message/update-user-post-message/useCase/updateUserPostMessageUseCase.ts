import createHttpError from "http-errors";
import { client as redisClient } from "../../../../lib/redis";
import { buildExpirationData } from "../../../post-message-cloudinary/create-post-message-cloudinary/useCase/domain/expiration.config";
import { UpdateUserPostMessageRepository } from "./updateUserPostMessageRepository";

interface IRequest {
  id: string;
  userId: string;
  expirationTimer: string;
}

export class UpdateUserPostMessageUseCase {
  private repository: UpdateUserPostMessageRepository;

  constructor() {
    this.repository = new UpdateUserPostMessageRepository();
  }

  async execute({ id, userId, expirationTimer }: IRequest) {
    const post = await this.repository.findPostById(id);

    if (!post) {
      throw createHttpError(404, "Post not found");
    }

    if (post.userId !== userId) {
      throw createHttpError(
        403,
        "You do not have permission to update this post",
      );
    }

    const expirationData = buildExpirationData(
      expirationTimer as any,
      new Date(),
    );

    const updatedPost = await this.repository.updatePost(id, {
      typeExpirationTimer: expirationTimer,
      expirationTimer: expirationData.expirationDate,
      isExpired: false,
    });

    const currentCachedPost = await redisClient.get(`post:${id}`);

    const cachedPost = currentCachedPost
      ? JSON.parse(currentCachedPost)
      : {
          id: updatedPost.id,
          image: updatedPost.image,
        };

    const nextCachedPost = {
      ...cachedPost,
      id: updatedPost.id,
      expirationTimer: expirationData.expirationDate,
      typeExpirationTimer: expirationTimer,
      expirationInSeconds: expirationData.expirationInSeconds,
      expirationAmount: expirationData.expirationAmount,
      expirationUnit: expirationData.expirationUnit,
    };

    await redisClient.setEx(
      `post:${id}`,
      expirationData.expirationInSeconds,
      JSON.stringify(nextCachedPost),
    );

    return {
      id: updatedPost.id,
      typeExpirationTimer: expirationTimer,
      expirationTimer: expirationData.expirationDate,
      expirationInSeconds: expirationData.expirationInSeconds,
      expirationAmount: expirationData.expirationAmount,
      expirationUnit: expirationData.expirationUnit,
      message: "Post updated successfully",
    };
  }
}
