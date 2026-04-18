import { Request, Response } from "express";
import { InteractionsUseCase } from "./InteractionsUseCase";

export class InteractionController {
  async handle(request: Request, response: Response) {
    const { targetType, targetId, type } = request.body;
    const userId = request.id_client;

    try {
      const useCase = new InteractionsUseCase();

      const result = await useCase.execute({
        actorId: userId,
        targetType,
        targetId,
        type,
      });

      return response.status(201).json(result);
    } catch (error: any) {
      return response.status(error.statusCode || 500).json({
        error: error.message,
      });
    }
  }
}
