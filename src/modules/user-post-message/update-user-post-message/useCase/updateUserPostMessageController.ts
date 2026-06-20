import { Request, Response } from "express";
import createHttpError from "http-errors";
import { UpdateUserPostMessageUseCase } from "./updateUserPostMessageUseCase";

export class UpdateUserPostMessageController {
  private useCase: UpdateUserPostMessageUseCase;

  constructor() {
    this.useCase = new UpdateUserPostMessageUseCase();
  }

  async handle(request: Request, response: Response) {
    const { id } = request.params;
    const userId = request.id_client;
    const { expirationTimer } = request.body;

    if (!id) {
      throw createHttpError(400, "O id do post é obrigatório");
    }

    if (!expirationTimer) {
      throw createHttpError(400, "O timer de expiração é obrigatório");
    }

    try {
      const updatedPost = await this.useCase.execute({
        id,
        userId,
        expirationTimer,
      });

      return response.status(200).json(updatedPost);
    } catch (error: any) {
      if (error.statusCode) {
        return response.status(error.statusCode).json({ error: error.message });
      }

      return response.status(400).json({ error: error.message });
    }
  }
}
