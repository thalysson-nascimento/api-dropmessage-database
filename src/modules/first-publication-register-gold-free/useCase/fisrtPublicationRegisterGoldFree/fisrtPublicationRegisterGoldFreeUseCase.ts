import createHttpError from "http-errors";
import clientStripe from "../../../../config/stripe.config";
import { FisrtPublicationRegisterGoldFreeRepository } from "./fisrtPublicationRegisterGoldFreeRepository";

export class FisrtPublicationRegisterGoldFreeUseCase {
  private repository: FisrtPublicationRegisterGoldFreeRepository;

  constructor() {
    this.repository = new FisrtPublicationRegisterGoldFreeRepository();
  }

  async execute(userId: string, priceId: string) {
    await this.repository.updateFirstPublication(userId);

    const userStripeId = await this.repository.userStripeCustomerrId(userId);

    if (!userStripeId) {
      throw createHttpError(404, "Usuário nao encontrado");
    }

    const activePlanGoldFreeTrial =
      await this.repository.activeSubscriptionGoldFreeTrial();

    if (!activePlanGoldFreeTrial) {
      throw createHttpError(404, "Plano Gold não encontrado");
    }

    if (!activePlanGoldFreeTrial.activePlan) {
      throw createHttpError(403, "Plano Gold não está ativo");
    }

    const findUserSubscriptionGoldFreeTrial =
      await this.repository.findUserActivePlanGoldFreeTrial(userId);

    if (findUserSubscriptionGoldFreeTrial) {
      throw createHttpError(400, "Usuário ja possui uma assinatura");
    }

    await this.repository.subscriptionGoldFreeTrial(userId);

    console.log("priceId", priceId);

    const subscription = await clientStripe.subscriptions.create({
      customer: userStripeId.customerId,
      items: [{ price: priceId }],
      coupon: "free_trial_7_days",
      trial_period_days: 7,
      payment_behavior: "default_incomplete",
      trial_settings: {
        end_behavior: {
          missing_payment_method: "cancel",
        },
      },
      metadata: {
        userId,
        priceId,
      },
    });

    console.log("=====>");
    console.log("subscription", subscription);

    return subscription;
  }
}
