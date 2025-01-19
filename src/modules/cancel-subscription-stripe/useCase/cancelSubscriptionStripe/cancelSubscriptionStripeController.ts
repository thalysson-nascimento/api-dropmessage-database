import { Request, Response } from "express";
import Joi from "joi";
import { CancelSubscriptionStripeUseCase } from "./cancelSubscriptionStripeUseCase";

const schema = Joi.object({
  subscriptionId: Joi.string().required().trim(),
}).unknown(false);

export class CancelSubscriptionStripeController {
  private useCase: CancelSubscriptionStripeUseCase;

  constructor() {
    this.useCase = new CancelSubscriptionStripeUseCase();
  }

  async handle(request: Request, response: Response) {
    const { value, error } = schema.validate(request.body);
    const userId = request.id_client;

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BADREQUEST",
        method: "post",
        statusCode: 400,
      });
    }

    try {
      const { subscriptionId } = value as { subscriptionId: string };
      const result = await this.useCase.execute(userId, subscriptionId);

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
