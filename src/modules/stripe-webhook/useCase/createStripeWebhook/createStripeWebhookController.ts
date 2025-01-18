import { Request, Response } from "express";
import Stripe from "stripe";
import clientStripe from "../../../../config/stripe.config";
import { CreateStripeWebhookUseCase } from "./createStripeWebhookUseCase";

export class CreateStripeWebhookController {
  private useCase: CreateStripeWebhookUseCase;

  constructor() {
    this.useCase = new CreateStripeWebhookUseCase();
  }

  async handle(request: Request, response: Response) {
    try {
      const body = request.body.toString();
      const sig = request.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY;
      let event: Stripe.Event;

      if (!sig) {
        return response
          .status(400)
          .send({ error: "Stripe signature is missing" });
      }

      if (!webhookSecret) {
        throw new Error(
          "STRIPE_WEBHOOK_SECRET_KEY is not defined in the environment variables"
        );
      }

      try {
        event = clientStripe.webhooks.constructEvent(body, sig, webhookSecret);
      } catch (error: any) {
        return response
          .status(400)
          .send({ error: `Webhook Error: ${error.message}` });
      }

      await this.useCase.execute(event);
      response.json({ received: true });
    } catch (error: any) {
      console.error(error);
      return response.status(error.statusCode || 500).json({
        error: error.message,
        code: error.statusCode || "ERR_INTERNAL_SERVER_ERROR",
        method: "post",
        statusCode: error.statusCode || 500,
      });
    }
  }
}
