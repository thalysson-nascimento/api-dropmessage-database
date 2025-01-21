import { ActiveSubscriptionRepository } from "./activeSubscriptionRepository";

export class ActiveSubscriptionUseCase {
  private repository: ActiveSubscriptionRepository;

  constructor() {
    this.repository = new ActiveSubscriptionRepository();
  }

  async execute(userId: string) {
    const activeSubscription = await this.repository.activeSubscription(userId);

    if (!activeSubscription || activeSubscription.status === "canceled") {
      return { activeSubscription: false };
    }

    const updatedSubscription = {
      ...activeSubscription,
      currentPeriodStart: activeSubscription.currentPeriodStart
        ? activeSubscription.currentPeriodStart * 1000
        : null,
      currentPeriodEnd: activeSubscription.currentPeriodEnd
        ? activeSubscription.currentPeriodEnd * 1000
        : null,
      cancelAt: activeSubscription.cancelAt
        ? activeSubscription.cancelAt * 1000
        : null,
      logoPath:
        activeSubscription.interval === "week"
          ? "https://res.cloudinary.com/dlereelmj/image/upload/v1737496410/logo-green_pwnznf.png"
          : activeSubscription.interval === "month" &&
            activeSubscription.intervalCount === 1
          ? "https://res.cloudinary.com/dlereelmj/image/upload/v1737496410/logo-yeloow_zgqcbu.png"
          : activeSubscription.interval === "month" &&
            activeSubscription.intervalCount === 6
          ? "https://res.cloudinary.com/dlereelmj/image/upload/v1737496410/logo-purple_rueoi0.png"
          : null,
    };

    return { activeSubscription: true, data: updatedSubscription };
  }
}
