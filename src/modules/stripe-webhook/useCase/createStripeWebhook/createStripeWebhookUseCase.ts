import { addDays, addMonths } from "date-fns";
import Stripe from "stripe";
import clientStripe from "../../../../config/stripe.config";
import { CreateStripeWebhookRepository } from "./createStripeWebhookRepository";

export class CreateStripeWebhookUseCase {
  private repository: CreateStripeWebhookRepository;

  constructor() {
    this.repository = new CreateStripeWebhookRepository();
  }

  async execute(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "checkout.session.completed":
        const productCatalog = (await clientStripe.prices.retrieve(
          subscription.metadata.priceId,
          {
            expand: ["product"],
          }
        )) as Stripe.Price & { product: Stripe.Product };

        const userId = subscription.metadata.userId;
        const idPrice = subscription.metadata.priceId;
        const plan = productCatalog.product.name;
        const active = true;
        const dateExpirationPlan = this.addTimerExepriationPlan(
          productCatalog.product.name
        );
        const unitAmount = productCatalog.unit_amount_decimal;
        const currency = productCatalog.currency;
        const status = productCatalog.active;

        await this.repository.assignaturePlan(
          userId,
          idPrice,
          plan,
          active,
          dateExpirationPlan,
          unitAmount,
          currency,
          status
        );

        break;
    }
  }

  private addTimerExepriationPlan(typePlan: string) {
    console.log("startDatePlan", typePlan);
    let expirationDate: Date;
    const currentDate = new Date();

    if (typePlan === "Start") {
      expirationDate = addDays(currentDate, 7);
      return expirationDate;
    }

    if (typePlan === "Gold") {
      expirationDate = addMonths(currentDate, 1);
      return expirationDate;
    }

    if (typePlan === "Diamond") {
      expirationDate = addMonths(currentDate, 6);
      return expirationDate;
    }

    if (typePlan === "Teste") {
      expirationDate = addMonths(currentDate, 6);
      return expirationDate;
    }

    return (expirationDate = addMonths(currentDate, 6));
  }
}
