import { Request, Response } from "express";
import { GetNotificationUseCase } from "./getNotificationUseCase";

export class GetNotificationController {
  async handle(request: Request, response: Response) {
    const userId = request.id_client;

    const useCase = new GetNotificationUseCase();

    const notifications = await useCase.execute(userId);

    return response.json(notifications);
  }
}
