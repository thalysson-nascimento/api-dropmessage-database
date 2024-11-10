import { StaticLikePreferencesRepository } from "./staticLikePreferencesRepository";

export class StaticLikePreferencesUseCase {
  private repository: StaticLikePreferencesRepository;

  constructor() {
    this.repository = new StaticLikePreferencesRepository();
  }

  async execute(userId: string) {
    const totalPosts = await this.repository.getTotalPostMessages(userId);
    const totalReceivedLikes = await this.repository.getTotalReceivedLikes(
      userId
    );
    const totalGivenLikes = await this.repository.getTotalGivenLikes(userId);

    return {
      totalPosts,
      totalReceivedLikes,
      totalGivenLikes,
    };
  }
}
