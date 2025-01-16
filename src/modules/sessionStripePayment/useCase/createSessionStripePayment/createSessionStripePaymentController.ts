import { Request, Response } from "express";
import { CreateSessionStripePaymentUseCase } from "./createSessionStripePaymentUseCase";

export class CreateSessionStripePaymentController {
  private useCase: CreateSessionStripePaymentUseCase;

  constructor() {
    this.useCase = new CreateSessionStripePaymentUseCase();
  }

  async handle(request: Request, response: Response) {
    const countryCode =
      request.headers["accept-language"]?.split("-")[1]?.toUpperCase() ||
      request.query.country ||
      "US";

    try {
      const { priceId } = request.body;
      const userId = request.id_client;

      const session = await this.useCase.execute(
        priceId,
        countryCode as string,
        userId
      );

      return response.status(200).json({
        success: true,
        url: session.url,
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
