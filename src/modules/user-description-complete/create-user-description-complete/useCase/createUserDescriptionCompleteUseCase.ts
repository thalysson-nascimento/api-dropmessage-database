import createHttpError from "http-errors";
import { CreateUserDescriptionCompleteRepository } from "./createUserDescriptionCompleteRepository";

export class CreateUserDescriptionCompleteUseCase {
  private repository: CreateUserDescriptionCompleteRepository;

  constructor() {
    this.repository = new CreateUserDescriptionCompleteRepository();
  }

  async execute(userDescription: string) {
    if (!userDescription) {
      throw createHttpError(404, "Descrição do usuário nao informada");
    }

    if (userDescription.length < 80) {
      throw createHttpError(
        402,
        "Descrição do usuário menor que 100 caracteres"
      );
    }

    return await this.repository.completeDescriptionWithGpt4oMini(
      userDescription
    );
  }
}
