import { UpdateAdMobVideoRewardRepository } from "./updateAdMobVideoRewardRepository";

export class UpdateAdMobVideoRewardUseCase {
  private repository: UpdateAdMobVideoRewardRepository;

  constructor() {
    this.repository = new UpdateAdMobVideoRewardRepository();
  }
  async execute(userId: string) {
    return await this.repository.updateAdMobVideoReward(userId);
  }
}
