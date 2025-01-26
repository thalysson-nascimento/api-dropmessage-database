import { Request, Response } from "express";
import { LastLikePostMessageUseCase } from "./lastLikePostMessageUseCase";

export class LastLikePostMessageController {
  private useCase: LastLikePostMessageUseCase;

  constructor() {
    this.useCase = new LastLikePostMessageUseCase();
  }

  async handle(request: Request, response: Response) {
    try {
      const userId = request.id_client;

      const lastLikePostMessage = await this.useCase.execute(userId);

      return response.status(200).json(lastLikePostMessage);
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
