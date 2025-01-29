import { UpdateViewCardFreeTrialRepository } from "./update-view-card-free-trialRepository";

export class UpdateViewCardFreeTrialUseCase {
  private repository: UpdateViewCardFreeTrialRepository;

  constructor() {
    this.repository = new UpdateViewCardFreeTrialRepository();
  }

  async execute(userId: string) {
    const user = await this.repository.userExist(userId);

    if (!user) {
      throw new Error("Usuário não encotrado");
    }

    return this.repository.updateViewCardFreeTrial(userId);
  }
}
