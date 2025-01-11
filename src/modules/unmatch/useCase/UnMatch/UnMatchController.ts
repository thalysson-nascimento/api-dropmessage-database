import { Request, Response } from "express";
import { UnMatchUseCase } from "./UnMatchUseCase";

export class UnMatchController {
  private useCase: UnMatchUseCase;

  constructor() {
    this.useCase = new UnMatchUseCase();
  }

  async handle(request: Request, response: Response) {
    try {
      // Implemente a lógica aqui
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