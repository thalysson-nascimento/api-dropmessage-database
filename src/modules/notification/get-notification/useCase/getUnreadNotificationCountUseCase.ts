import { GetNotificationRepository } from "./getNotificationRepository";

export class GetUnreadNotificationCountUseCase {
  private repository = new GetNotificationRepository();

  async execute(userId: string) {
    const count = await this.repository.countUnread(userId);
    return {
      count,
      hasUnread: count > 0,
    };
  }
}
