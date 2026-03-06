import { Request, Response } from "express";
import { ListUserHobbiesUseCase } from "./listUserHobbiesUseCase";

export class ListUserHobbiesController {
  async handle(request: Request, response: Response) {
    const userId = request.id_client;

    const useCase = new ListUserHobbiesUseCase();

    const notifications = await useCase.execute(userId);

    return response.json(notifications);
  }
}
