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
      let event: any;

      try {
        event = clientStripe.webhooks.constructEvent(
          body,
          sig as string,
          process.env.STRIPE_WEBHOOK_SECRET_KEY as string
        );
      } catch (error: any) {
        console.log("error", error);
        response.status(400).send(`Webhook Error: ${error.message}`);
      }

      // Handle the event
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object;
          console.log("PaymentIntent was successful!", paymentIntent);
          break;
        case "payment_method.attached":
          const paymentMethod = event.data.object;
          console.log(
            "PaymentMethod was attached to a Customer!",
            paymentMethod
          );
          break;
        // ... handle other event types
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      response.json({ received: true });
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
