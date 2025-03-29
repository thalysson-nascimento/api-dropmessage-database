import { GetLastLoggedUsersRepository } from "./GetLastLoggedUsersRepository";

export class GetLastLoggedUsersUseCase {
  private repository: GetLastLoggedUsersRepository;

  constructor() {
    this.repository = new GetLastLoggedUsersRepository();
  }

  async execute(userId: string) {
    return await this.repository.getLastLoggedUsers(userId);
  }
}
