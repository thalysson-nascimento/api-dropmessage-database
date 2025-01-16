import { Request, Response } from "express";
import clientStripe from "../../../../config/stripe.config";
import { CreateStripeWebhookUseCase } from "./createStripeWebhookUseCase";

export class CreateStripeWebhookController {
  private useCase: CreateStripeWebhookUseCase;

  constructor() {
    this.useCase = new CreateStripeWebhookUseCase();
  }

  async handle(request: Request, response: Response) {
    try {
      // Implemente a lógica aqui
      const body = request.body;
      const sig = request.headers["stripe-signature"];
      let event;

      try {
        event = clientStripe.webhooks.constructEvent(
          body,
          sig as string,
          process.env.STRIPE_WEBHOOK_SECRET as string
        );
      } catch (error: any) {
        console.log("error", error);
        response.status(400).send(`Webhook Error: ${error.message}`);
      }

      console.log("event", event);
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
