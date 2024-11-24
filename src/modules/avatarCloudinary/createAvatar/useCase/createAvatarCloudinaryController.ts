import { Request, Response } from "express";
import { CreateAvatarCloudinaryUseCase } from "./createAvatarCloudinaryUseCase";

export class CreateAvatarCloudinaryController {
  private useCase: CreateAvatarCloudinaryUseCase;

  constructor() {
    this.useCase = new CreateAvatarCloudinaryUseCase();
  }

  async handle(request: Request, response: Response) {
    const userId = request.id_client;
    const file = request.file as Express.Multer.File;

    if (!file) {
      return response.status(400).json({
        error: "Nenhuma imagem foi enviada",
      });
    }

    try {
      const createAvatar = await this.useCase.execute(userId, file);
      return response.status(201).json(createAvatar);
    } catch (error: any) {
      return response.status(400).json({ error: error.message });
    }
  }
}
