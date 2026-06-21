import createHttpError from "http-errors";
import { GetConfirmationCodeEmailRepository } from "./getCodeConfirmationEmailRepository";

export class GetCodeConfirmationEmailUseCase {
  private repository: GetConfirmationCodeEmailRepository;

  constructor() {
    this.repository = new GetConfirmationCodeEmailRepository();
  }

  async execute(userId: string, codeConfirmation: number) {
    // console.log(userId, codeConfirmation);
    // return true;
    const codeConfirmationEmail =
      await this.repository.getConfirmationCodeEmail(userId, codeConfirmation);

    if (!codeConfirmationEmail) {
      throw createHttpError(404, "Code confirmation not found");
    }

    await this.repository.userUpdateConfirmationCodeEmail(userId);

    await this.repository.deleteConfirmationCodeEmail(userId);

    return codeConfirmationEmail;
  }
}
