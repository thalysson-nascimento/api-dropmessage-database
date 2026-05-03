import { AboutMeRepository } from "./createOrUpdateProfessionRepository";

export class CreateOrUpdateProfessionUseCase {
  constructor(private aboutMeRepository: AboutMeRepository) {}

  async execute(userId: string, profession: string) {
    if (!profession) {
      throw new Error("profession is required");
    }
    return this.aboutMeRepository.createOrUpdateProfession(userId, profession);
  }
}
