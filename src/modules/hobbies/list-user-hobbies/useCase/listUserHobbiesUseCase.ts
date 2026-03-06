import { ListUserHobbiesRepository } from "./listUserHobbiesRepository";

export class ListUserHobbiesUseCase {
  private repository = new ListUserHobbiesRepository();
  async execute(userId: string) {
    return await this.repository.listUserHobbiesById(userId);
  }
}
