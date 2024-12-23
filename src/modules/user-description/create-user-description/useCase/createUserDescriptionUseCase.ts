import createHttpError from "http-errors";
import { CreateUserDescriptionRepository } from "./createUserDescriptionRepository";

export class CreateUserDescriptionUseCase {
  private repository: CreateUserDescriptionRepository;

  constructor() {
    this.repository = new CreateUserDescriptionRepository();
  }

  async execute(userId: string, userDescription: string) {
    const existUserDescription = await this.repository.existUserDescription(
      userId
    );

    if (existUserDescription) {
      throw createHttpError(400, "Descrição do usuário ja cadastrada");
    }

    return this.repository.createUserDescription(userId, userDescription);
  }
}
