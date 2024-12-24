import createHttpError from "http-errors";
import { CreateGenerateTipsWithGpt4oMiniRepository } from "./createGenerateTipsWithGpt4oMiniRepository";

export class CreateGenerateTipsWithGpt4oMiniUseCase {
  repository: CreateGenerateTipsWithGpt4oMiniRepository;

  constructor() {
    this.repository = new CreateGenerateTipsWithGpt4oMiniRepository();
  }

  async execute(matchId: string, userId: string) {
    const existeMatch = await this.repository.getMatchById(matchId);

    if (!existeMatch) {
      throw createHttpError(404, "Match nao encontrado");
    }

    const userDescription = await this.repository.getUserDescription(userId);

    const filterMatchedUserDescription =
      await this.repository.findMatchedUserDescription(userId, matchId);

    if (
      !userDescription?.description ||
      !filterMatchedUserDescription?.description
    ) {
      throw createHttpError(404, "Descrição do usuário nao encontrada");
    }

    const stream = this.repository.createGenerateTipsWithGpt4oMini(
      userDescription.description,
      filterMatchedUserDescription.description
    );

    return stream;
  }
}
