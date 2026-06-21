import { CreateCommentPostMessageRepository } from "./createCommentPostMessageRepository";
import createHttpError from "http-errors";
import { CreateNotificationUseCase } from "../../../notification/create-notification/useCase/createNotificationUseCase";

interface IRequest {
  id: string; // post id
  userId: string; // actorId
  content: string;
}

export class CreateCommentPostMessageUseCase {
  private repository: CreateCommentPostMessageRepository;

  constructor() {
    this.repository = new CreateCommentPostMessageRepository();
  }

  async execute({ id, userId, content }: IRequest) {
    const post = await this.repository.findPostById(id);

    if (!post) {
      throw createHttpError(404, "Post not found");
    }

    if (post.isExpired) {
      throw createHttpError(409, "Post is expired");
    }

    // Valida se o usuário tem um desbloqueio de comentário ativo para este post (deve existir e ter used = false)
    const unlock = await this.repository.findActiveUnlock(userId, id);

    if (!unlock || unlock.used || !unlock.unlocked) {
      throw createHttpError(
        403,
        "You must watch a promotional video before commenting"
      );
    }

    // 1. Cria o comentário no banco de dados
    const comment = await this.repository.createComment(userId, id, content);

    // 2. Consome o desbloqueio (marca como usado)
    await this.repository.consumeUnlock(userId, id);

    // 3. Dispara a notificação para o autor do post
    const createNotificationUseCase = new CreateNotificationUseCase();
    await createNotificationUseCase.execute({
      notifiedUserId: post.userId,
      actorId: userId,
      type: "COMMENT",
      postId: id,
    });

    return {
      message: "Comment posted successfully",
      comment,
    };
  }
}
