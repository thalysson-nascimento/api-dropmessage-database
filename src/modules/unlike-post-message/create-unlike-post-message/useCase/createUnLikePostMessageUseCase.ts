import createHttpError from "http-errors";
import { CreateUnLikePostMessageRepository } from "./createUnLikePostMessageRepository";

export class CreateUnLikePostMessageUseCase {
  private repository: CreateUnLikePostMessageRepository;

  constructor() {
    this.repository = new CreateUnLikePostMessageRepository();
  }

  async execute(postMessageId: string, userId: string) {
    // Await the promise to resolve the post message before checking for existence
    const existPostMessage = await this.repository.findPostMessageById(
      postMessageId
    );

    if (!existPostMessage) {
      throw createHttpError(404, "Postagem não encontrada");
    }

    const likedPostMessage = await this.repository.findUnLikePostMessage(
      postMessageId,
      userId
    );

    if (likedPostMessage) {
      throw createHttpError(409, "Postagem ja foi descurtida");
    }

    const createUnLikePostMessage = await this.repository.unLikePostMessage(
      postMessageId,
      userId
    );

    return createUnLikePostMessage;
  }
}
