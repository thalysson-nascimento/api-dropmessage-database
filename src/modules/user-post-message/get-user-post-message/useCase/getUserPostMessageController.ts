import { Request, Response } from "express";
import { GetUserPostMessageUseCase } from "./getUserPostMessageUseCase";
export class GetUserPostMessageController {
  private getUsetPostMessageUseCase: GetUserPostMessageUseCase;

  constructor() {
    this.getUsetPostMessageUseCase = new GetUserPostMessageUseCase();
  }

  async handle(request: Request, response: Response) {
    try {
      const page = Number(request.query.page) || 1;
      const limit = Number(request.query.limit) || 10;

      // Se page ou limit forem NaN ou menores que 1, defina como valores padrões
      if (page < 1 || limit < 1) {
        return response
          .status(400)
          .json({ message: "Page e limit devem ser maiores que 0" });
      }
      const userId = request.id_client;
      const result = await this.getUsetPostMessageUseCase.execute(
        page,
        limit,
        userId
      );
      return response.json(result);
    } catch (error) {
      return response.status(500).json({ error: "Internal server error" });
    }
  }
}
