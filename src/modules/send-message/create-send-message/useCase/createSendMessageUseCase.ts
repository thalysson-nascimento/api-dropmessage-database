import createHttpError from "http-errors";
import { CreateSendMessageRepository } from "./createSendMessageRepository";

export class CreateSendMessageUseCase {
  private repository: CreateSendMessageRepository;

  constructor() {
    this.repository = new CreateSendMessageRepository();
  }

  async execute(
    userId: string,
    matchId: string,
    userHashPublic: string,
    message: string
  ) {
    const match = await this.repository.getMahctById(matchId);

    if (!match) {
      throw createHttpError(404, "Match não encontrado");
    }

    // Obter todos os possíveis `userHashPublic` associados ao match
    const userHashPublicList = [
      match.initiator?.userHashPublic,
      match.recipient?.userHashPublic,
      ...match.User.map((user) => user.userHashPublic),
    ].filter(Boolean); // Remove valores nulos/undefined

    if (!userHashPublicList.includes(userHashPublic)) {
      throw createHttpError(404, "Match não pertence ao usuário");
    }

    return this.repository.createSendMessage(matchId, userId, message);
  }
}
