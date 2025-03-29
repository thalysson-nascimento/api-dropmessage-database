import { Request, Response } from "express";
import { GetLastLoggedUsersUseCase } from "./GetLastLoggedUsersUseCase";

export class GetLastLoggedUsersController {
  private useCase: GetLastLoggedUsersUseCase;

  constructor() {
    this.useCase = new GetLastLoggedUsersUseCase();
  }

  async handle(request: Request, response: Response) {
    try {
      // Implemente a lógica aqui
      const userId = request.id_client;

      const result = await this.useCase.execute(userId);

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
