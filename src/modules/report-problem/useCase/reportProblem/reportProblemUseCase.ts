import createHttpError from "http-errors";
import { ReportProblemRepository } from "./reportProblemRepository";

export class ReportProblemUseCase {
  private repository: ReportProblemRepository;

  constructor() {
    this.repository = new ReportProblemRepository();
  }

  async execute(userId: string, matchId: string, reportProblem: string) {
    const existMatch = await this.repository.getMatchById(matchId);

    if (!existMatch) {
      throw createHttpError(404, "Match nao encontrado");
    }

    const findUserMatch = [existMatch.initiatorId, existMatch.recipientId];

    const findUser = findUserMatch.includes(userId);

    if (!findUser) {
      throw createHttpError(404, "Usuário nao encontrado");
    }

    await this.repository.reportProblem(userId, matchId, reportProblem);

    const response = await this.repository.userUnMatch(matchId);

    return response;
  }
}
