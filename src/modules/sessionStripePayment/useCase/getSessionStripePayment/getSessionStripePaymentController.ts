import { Request, Response } from "express";
import { GetSessionStripePaymentUseCase } from "./getSessionStripePaymentUseCase";

export class GetSessionStripePaymentController {
  private useCase: GetSessionStripePaymentUseCase;

  constructor() {
    this.useCase = new GetSessionStripePaymentUseCase();
  }

  async handle(request: Request, response: Response) {
    const countryCode =
      request.headers["accept-language"]?.split("-")[1]?.toUpperCase() ||
      request.query.country ||
      "US";

    try {
      const result = await this.useCase.execute(countryCode as string);

      return response.status(200).json({
        success: true,
        data: result,
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
