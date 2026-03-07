import { Request, Response } from "express";
import { UpdateAvatarUseCase } from "./updateAvatarUseCase";

export class UpdateAvatarController {
  private useCase: UpdateAvatarUseCase;

  constructor() {
    this.useCase = new UpdateAvatarUseCase();
  }

  async handle(request: Request, response: Response) {
    try {
      const userId = request.id_client; // assumindo middleware de auth
      const file = request.file as Express.Multer.File;

      if (!file) {
        return response.status(400).json({
          message: "Avatar file is required",
          code: "ERR_AVATAR_REQUIRED",
          statusCode: 400,
        });
      }

      const result = await this.useCase.execute({
        userId,
        fileBuffer: file.buffer,
        fileName: file.originalname,
      });

      return response.status(200).json(result);
    } catch (error: any) {
      return response.status(error.statusCode || 500).json({
        message: error.message,
        code: error.statusCode || "ERR_INTERNAL_SERVER_ERROR",
        method: "post",
        statusCode: error.statusCode || 500,
      });
    }
  }
}
