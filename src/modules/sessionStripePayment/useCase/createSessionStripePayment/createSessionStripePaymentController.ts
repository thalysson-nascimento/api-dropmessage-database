import { Request, Response } from "express";
import { CreateSessionStripePaymentUseCase } from "./createSessionStripePaymentUseCase";

export class CreateSessionStripePaymentController {
  private useCase: CreateSessionStripePaymentUseCase;

  constructor() {
    this.useCase = new CreateSessionStripePaymentUseCase();
  }

  async handle(request: Request, response: Response) {
    try {
      const { priceId } = request.body;
      const userId = request.id_client;

      const { client_secret } = await this.useCase.execute(priceId, userId);

      return response.status(200).json({
        client_secret: client_secret,
      });
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
