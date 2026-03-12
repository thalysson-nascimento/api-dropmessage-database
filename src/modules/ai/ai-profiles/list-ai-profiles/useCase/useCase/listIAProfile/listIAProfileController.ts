import { Request, Response } from "express";
import { ListIAProfileUseCase } from "./listIAProfileUseCase";

export class ListIAProfileController {
  private useCase: ListIAProfileUseCase;

  constructor() {
    this.useCase = new ListIAProfileUseCase();
  }

  async handle(request: Request, response: Response) {
    try {
      const userId = request.id_client;
      const profiles = await this.useCase.execute(userId);

      return response.status(200).json(profiles);
    } catch (error: any) {
      return response.status(error.statusCode || 500).json({
        message: error.message,
        code: error.statusCode || "ERR_INTERNAL_SERVER_ERROR",
        method: "get",
        statusCode: error.statusCode || 500,
      });
    }
  }
}
