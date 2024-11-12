import { GetPostMessageRepository } from "./getUserPostMessageRepository";

export class GetUserPostMessageUseCase {
  private repository: GetPostMessageRepository;

  constructor() {
    this.repository = new GetPostMessageRepository();
  }

  execute(page: number, limit: number, userId: string) {
    return this.repository.getUserPostMessage(page, limit, userId);
  }
}
