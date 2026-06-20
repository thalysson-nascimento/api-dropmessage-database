import { DeleteUserPostMessageRepository } from "./deleteUserPostMessageRepository";
import { deleteAuthenticatedImage } from "../../../../service/cloudinary.service";
import { client as redisClient } from "../../../../lib/redis";
import createHttpError from "http-errors";

interface IRequest {
  id: string;
  userId: string;
}

export class DeleteUserPostMessageUseCase {
  private repository: DeleteUserPostMessageRepository;

  constructor() {
    this.repository = new DeleteUserPostMessageRepository();
  }

  async execute({ id, userId }: IRequest) {
    const post = await this.repository.findPostById(id);

    if (!post) {
      throw createHttpError(404, "Post not found");
    }

    if (post.userId !== userId) {
      throw createHttpError(403, "You do not have permission to delete this post");
    }

    try {
      // 1. Delete from database
      await this.repository.deletePost(id);
    } catch (dbError: any) {
      throw createHttpError(500, `Error deleting from database: ${dbError.message}`);
    }

    try {
      // 2. Delete from Cloudinary (the image field stores the public_id)
      await deleteAuthenticatedImage(post.image);
    } catch (cloudinaryError: any) {
      throw createHttpError(
        500,
        `Post deleted from database, but an error occurred while deleting the file on Cloudinary: ${cloudinaryError.message}`
      );
    }

    try {
      // 3. Remove from Redis cache if exists
      await redisClient.del(`post:${id}`);
    } catch (redisError: any) {
      console.error(`Error deleting Redis key for post ${id}:`, redisError);
    }

    return { message: "Post deleted successfully" };
  }
}

