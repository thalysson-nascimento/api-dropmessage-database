import { Decimal } from "@prisma/client/runtime";
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

        const productId = subscriptionUpdate.items.data[0].price
          .product as string;
        const product = await clientStripe.products.retrieve(productId);

        const userId = invoice.subscription_details?.metadata?.userId as string;
        const priceId = invoice.subscription_details?.metadata
          ?.priceId as string;
        const subscription = invoice.subscription as string;
        const amountPaid = new Decimal(invoice.amount_paid / 100);
        const plan = product.name;
        const country = invoice.account_country;
        const currency = invoice.currency.toUpperCase();
        const status = subscriptionUpdate.status;
        const currentPeriodStart = invoice.lines.data[0].period.start;
        const currentPeriodEnd = invoice.lines.data[0].period.end;
        const description = invoice.lines.data[0].description as string;
        const interval = invoice.lines.data[0].plan?.interval;
        const intervalCount = invoice.lines.data[0].plan
          ?.interval_count as number;

        let colorTop = "#FFFFFF";
        let colorBottom = "#000000";

        if (interval === "week") {
          colorTop = "#00B894";
          colorBottom = "#03836A";
        } else if (interval === "month" && intervalCount === 1) {
          colorTop = "#DCC156";
          colorBottom = "#856E14";
        } else if (interval === "month" && intervalCount === 6) {
          colorTop = "#996D6D";
          colorBottom = "#55236B";
        }

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
          currentPeriodEnd,
          description,
          colorTop,
          colorBottom,
          intervalCount,
          interval
        );

        break;
      case "customer.subscription.updated":
        const subscriptionUpdateCancel = event.data
          .object as Stripe.Subscription;
        const idSubscriptionCancel = subscriptionUpdateCancel.id;
        const cancelAtPriodEnd = subscriptionUpdateCancel.cancel_at_period_end;
        const statusCancel = subscriptionUpdateCancel.status;
        const cancelAt = subscriptionUpdateCancel?.cancel_at;

        if (cancelAtPriodEnd) {
          await this.repository.cancledAssignaturePlan(
            idSubscriptionCancel,
            cancelAtPriodEnd,
            statusCancel,
            cancelAt
          );
        }

        break;
    }
  }
}
