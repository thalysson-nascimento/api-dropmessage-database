import { Request, Response } from "express";
import { ActiveSubscriptionUseCase } from "./activeSubscriptionUseCase";

export class ActiveSubscriptionController {
  private useCase: ActiveSubscriptionUseCase;

  constructor() {
    this.useCase = new ActiveSubscriptionUseCase();
  }

  async handle(request: Request, response: Response) {
    try {
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
