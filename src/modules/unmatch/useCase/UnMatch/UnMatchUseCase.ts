import createHttpError from "http-errors";
import { UnMatchRepository } from "./UnMatchRepository";

export class UnMatchUseCase {
  private repository: UnMatchRepository;

  constructor() {
    this.repository = new UnMatchRepository();
  }

  async execute(userId: string, matchId: string) {
    const existMatch = await this.repository.getMatchById(matchId);

    if (!existMatch) {
      throw createHttpError(404, "Match nao encontrado");
    }

    const findUserMatch = [existMatch.initiatorId, existMatch.recipientId];

    const findUser = findUserMatch.includes(userId);

    if (!findUser) {
      throw createHttpError(404, "Usuário nao encontrado");
    }

    const response = await this.repository.userUnMatch(matchId);

    return response;
  }
}
