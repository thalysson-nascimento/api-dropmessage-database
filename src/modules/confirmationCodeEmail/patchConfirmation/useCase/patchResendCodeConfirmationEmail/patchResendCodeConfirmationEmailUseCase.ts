import createHttpError from "http-errors";
import { CreateCodeConfirmationEmail } from "../../../../../service/createCodeConfirmationEmail";
import { PatchResendCodeConfirmationEmailRepository } from "./patchResendCodeConfirmationEmailRepository";

export class PatchResendCodeConfirmationEmailUseCase {
  private repository: PatchResendCodeConfirmationEmailRepository;

  constructor() {
    this.repository = new PatchResendCodeConfirmationEmailRepository();
  }

  async execute(userId: string) {
    const confirmationCodeEmail = new CreateCodeConfirmationEmail();
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw createHttpError(404, "Usuário nao encontrado");
    }

    void confirmationCodeEmail.codeConfirmation(user);

    return { sucess: true };
  }
}
