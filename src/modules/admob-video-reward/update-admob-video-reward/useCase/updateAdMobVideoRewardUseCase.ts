import { UpdateAdMobVideoRewardRepository } from "./updateAdMobVideoRewardRepository";

export class UpdateAdMobVideoRewardUseCase {
  private repository: UpdateAdMobVideoRewardRepository;

  constructor() {
    this.repository = new UpdateAdMobVideoRewardRepository();
  }
  async execute(userId: string) {
    console.log(userId);
  }
}
