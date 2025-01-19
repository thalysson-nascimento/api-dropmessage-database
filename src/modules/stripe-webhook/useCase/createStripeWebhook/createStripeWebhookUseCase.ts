import Stripe from "stripe";
import clientStripe from "../../../../config/stripe.config";
import { CreateStripeWebhookRepository } from "./createStripeWebhookRepository";

export class CreateStripeWebhookUseCase {
  private repository: CreateStripeWebhookRepository;

  constructor() {
    this.repository = new CreateStripeWebhookRepository();
  }

  async execute(event: Stripe.Event) {
    switch (event.type) {
      case "invoice.payment_succeeded":
        const invoice = event.data.object as Stripe.Invoice;

        const { id, metadata } = await clientStripe.subscriptions.retrieve(
          invoice.subscription as string
        );

        // Atualizar o metadata da assinatura com os dados da sessão de checkout
        const subscriptionUpdate = await clientStripe.subscriptions.update(id, {
          metadata: {
            userId: metadata?.userId as string,
            priceId: metadata?.priceId as string,
          },
        });

        const userId = invoice.subscription_details?.metadata?.userId as string;
        const priceId = invoice.subscription_details?.metadata
          ?.priceId as string;
        const subscription = invoice.subscription as string;
        const amountPaid = invoice.amount_paid;
        const plan = subscriptionUpdate.items.data[0].plan.interval;
        const country = invoice.account_country;
        const currency = invoice.currency;
        const status = subscriptionUpdate.status;
        const currentPeriodStart = invoice.period_start;
        const currentPeriodEnd = invoice.period_end;

        await this.repository.createAssignaturePlan(
          userId,
          priceId,
          subscription,
          amountPaid,
          plan,
          country,
          currency,
          status,
          currentPeriodStart,
          currentPeriodEnd
        );

        break;
      case "customer.subscription.updated":
        const subscriptionUpdateCancel = event.data
          .object as Stripe.Subscription;
        const idSubscriptionCancel = subscriptionUpdateCancel.id;
        const cancelAtPriodEnd = subscriptionUpdateCancel.cancel_at_period_end;
        const statusCancel = subscriptionUpdateCancel.status;
        const cancelAt = subscriptionUpdateCancel?.cancel_at;

        await this.repository.cancledAssignaturePlan(
          idSubscriptionCancel,
          cancelAtPriodEnd,
          statusCancel,
          cancelAt
        );
        break;
    }
  }
}
