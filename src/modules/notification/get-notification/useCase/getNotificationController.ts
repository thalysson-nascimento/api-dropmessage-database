import { Request, Response } from "express";
import { GetNotificationUseCase } from "./getNotificationUseCase";

export class GetNotificationController {
  async handle(request: Request, response: Response) {
    const userId = request.id_client;

    const getNotificationUseCase = new GetNotificationUseCase();
    const result = await getNotificationUseCase.execute(userId);

    return response.json(result);
  }
}
