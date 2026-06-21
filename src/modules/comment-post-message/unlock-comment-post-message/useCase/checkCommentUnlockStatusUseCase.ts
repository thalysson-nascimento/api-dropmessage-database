import { UnlockCommentPostMessageRepository } from "./unlockCommentPostMessageRepository";
import createHttpError from "http-errors";

interface IRequest {
  id: string; // post id
  userId: string;
}

export class CheckCommentUnlockStatusUseCase {
  private repository: UnlockCommentPostMessageRepository;

  constructor() {
    this.repository = new UnlockCommentPostMessageRepository();
  }

  async execute({ id, userId }: IRequest) {
    const post = await this.repository.findPostById(id);

    if (!post) {
      throw createHttpError(404, "Post not found");
    }

    if (post.isExpired) {
      throw createHttpError(409, "Post is expired");
    }

    const unlock = await this.repository.findActiveUnlock(userId, id);

    const isUnlocked = !!unlock && unlock.unlocked && !unlock.used;

    return { unlocked: isUnlocked };
  }
}
