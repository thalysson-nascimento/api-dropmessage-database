import { Request, Response } from "express";
import { GetUnreadNotificationCountUseCase } from "./getUnreadNotificationCountUseCase";

export class GetUnreadNotificationCountController {
  async handle(request: Request, response: Response) {
    const userId = request.id_client;

    const useCase = new GetUnreadNotificationCountUseCase();

    try {
      const result = await useCase.execute(userId);
      return response.json(result);
    } catch (error: any) {
      return response.status(500).json({ error: error.message });
    }
  }
}
