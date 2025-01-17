import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();

export class CreateStripeWebhookRepository {
  async assignaturePlan(subscription: Stripe.Subscription) {
    const teste = subscription.metadata.userId;
    console.log("userId ===>", teste);
  }
}
