import { ActiveSubscriptionRepository } from "./activeSubscriptionRepository";

export class ActiveSubscriptionUseCase {
  private repository: ActiveSubscriptionRepository;

  constructor() {
    this.repository = new ActiveSubscriptionRepository();
  }

  async execute(userId: string) {
    const userSignature = await this.repository.activeSubscription(userId);
    if (!userSignature) {
      return { activeSubscription: false };
    }

    const subscriptionWithProduct = await this.repository.subscriptionById(
      userSignature.subscription
    );

    const updatedSubscription = {
      cancelAt: subscriptionWithProduct.cancel_at
        ? subscriptionWithProduct.cancel_at * 1000
        : null,
      cancelAtPeriodEnd: subscriptionWithProduct.cancel_at_period_end,
      currentPeriodStart: subscriptionWithProduct.current_period_start
        ? subscriptionWithProduct.current_period_start * 1000
        : null,
      currentPeriodEnd: subscriptionWithProduct.current_period_end
        ? subscriptionWithProduct.current_period_end * 1000
        : null,
      status: subscriptionWithProduct.status,
      subscription: subscriptionWithProduct.id,
      priceId: subscriptionWithProduct.items.data[0].price.id,
      plan: subscriptionWithProduct.product.name,
      description: subscriptionWithProduct.product.description,
      interval: userSignature.interval,
      intervalCount: userSignature.intervalCount,
      colorTop: userSignature.colorTop,
      colorBottom: userSignature.colorBottom,
      amountPaid: userSignature.amountPaid,
      currency: userSignature.currency,
      logoPath: this.logoPath(
        userSignature.interval,
        userSignature.intervalCount
      ),
    };
    return { activeSubscription: true, data: updatedSubscription };
  }

  private logoPath(interval: string | null, intervalCount?: number) {
    if (interval === "week") {
      return "https://res.cloudinary.com/dlereelmj/image/upload/v1737918313/public-image/j4f8psefs98dykutfdtr.svg";
    } else if (interval === "month" && intervalCount === 1) {
      return "https://res.cloudinary.com/dlereelmj/image/upload/v1737918639/public-image/jcvi9gsq1m6jbtiq3sme.svg";
    } else if (interval === "month" && intervalCount === 6) {
      return "https://res.cloudinary.com/dlereelmj/image/upload/v1737918713/public-image/llprqodeb9puhi3bm1tw.svg";
    } else {
      return null;
    }
  }
}
