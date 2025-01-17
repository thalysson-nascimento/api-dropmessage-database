import Stripe from "stripe";
import { CreateStripeWebhookRepository } from "./createStripeWebhookRepository";

export class CreateStripeWebhookUseCase {
  private repository: CreateStripeWebhookRepository;

  constructor() {
    this.repository = new CreateStripeWebhookRepository();
  }

  async execute(subscription: Stripe.Subscription) {
    // Implemente a lógica aqui
    await this.repository.assignaturePlan(subscription);
  }
}
