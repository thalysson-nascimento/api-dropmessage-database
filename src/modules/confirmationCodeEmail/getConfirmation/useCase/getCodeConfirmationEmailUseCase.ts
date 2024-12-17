import createHttpError from "http-errors";
import { GetConfirmationCodeEmailRepository } from "./getCodeConfirmationEmailRepository";

export class GetCodeConfirmationEmailUseCase {
  private repository: GetConfirmationCodeEmailRepository;

  constructor() {
    this.repository = new GetConfirmationCodeEmailRepository();
  }

  async execute(userId: string, codeConfirmation: number) {
    const codeConfirmationEmail =
      await this.repository.getConfirmationCodeEmail(userId, codeConfirmation);

    if (!codeConfirmationEmail) {
      throw createHttpError(404, "Codigo de confirmacao nao encontrado");
    }

    await this.repository.userUpdateConfirmationCodeEmail(userId);

    return codeConfirmationEmail;
  }
}
