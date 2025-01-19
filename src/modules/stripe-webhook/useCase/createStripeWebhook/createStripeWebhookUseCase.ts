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
    const session = event.data.object as Stripe.Checkout.Session;

    switch (event.type) {
      case "checkout.session.completed":
        const product = (await clientStripe.prices.retrieve(
          subscription.metadata.priceId,
          {
            expand: ["product"],
          }
        )) as Stripe.Price & { product: Stripe.Product };

        const dateSubscription = await clientStripe.subscriptions.retrieve(
          session.subscription as string
        );

        const userId = subscription.metadata.userId;
        const idSignature = session.subscription as string;
        const priceId = product.id;
        const unitAmountDecimal = product.unit_amount_decimal;
        const plan = product.product.name;
        const country = session.customer_details?.address?.country;
        const currency = subscription.currency;
        const status = subscription.status;
        const currentPriodStart = dateSubscription.current_period_start;
        const currentPriodEnd = dateSubscription.current_period_end;

        await this.repository.createAssignaturePlan(
          userId,
          idSignature,
          priceId,
          unitAmountDecimal,
          plan,
          country,
          currency,
          status,
          currentPriodStart,
          currentPriodEnd
        );
        break;
      case "customer.subscription.updated":
        const subscriptionUpdated = event.data.object as Stripe.Subscription;
        const idSignatureProduct = subscription.id;
        const cancelAtPeriodEnd = subscriptionUpdated.cancel_at_period_end;
        const statusSubscription = subscriptionUpdated.status;
        const cancelAt = subscriptionUpdated?.cancel_at;

        console.log(
          idSignatureProduct,
          cancelAtPeriodEnd,
          statusSubscription,
          cancelAt
        );

        this.repository.cancledAssignaturePlan(
          idSignatureProduct,
          cancelAtPeriodEnd,
          statusSubscription,
          cancelAt
        );

        break;
    }
  }
}
