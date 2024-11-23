import createHttpError from "http-errors";
import { DeleteAccountRepository } from "./deleteAccountRepository";

export class DeleteAccountUseCase {
  private repository: DeleteAccountRepository;
  constructor() {
    this.repository = new DeleteAccountRepository();
  }

  async execute(userId: string) {
    const existUser = await this.repository.findUserById(userId);

    if (!existUser) {
      throw createHttpError(404, "Usuário nao encontrado");
    }

    return this.repository.deleteAccountByUserId(userId);
  }
}
