import { Request, Response } from "express";
import createHttpError from "http-errors";
import { CreatePostMessageCloudinaryUseCase } from "./createPostMessageCloudinaryUseCase";

export class CreatePostMessageCloudinaryController {
  private useCase: CreatePostMessageCloudinaryUseCase;

  constructor() {
    this.useCase = new CreatePostMessageCloudinaryUseCase();
  }

  async handle(request: Request, response: Response) {
    const userId = request.id_client;
    const expirationTimer = request.body.expirationTimer;
    const file = request.file as Express.Multer.File;

    if (!file) {
      throw createHttpError(400, "Nenhum arquivo foi enviado");
    }

    if (!expirationTimer) {
      throw createHttpError(400, "O tempo de expiração é obrigatório");
    }

    try {
      const createPostMessageCloudinary = await this.useCase.execute(
        userId,
        expirationTimer,
        file
      );
      return response.status(201).json(createPostMessageCloudinary);
    } catch (error: any) {
      return response.status(400).json({ error: error.message });
    }
  }
}
