import createHttpError from "http-errors";
import clientStripe from "../../../../config/stripe.config";
import { CancelSubscriptionStripeRepository } from "./cancelSubscriptionStripeRepository";

export class CancelSubscriptionStripeUseCase {
  private repository: CancelSubscriptionStripeRepository;

  constructor() {
    this.repository = new CancelSubscriptionStripeRepository();
  }

  async execute(userId: string, subscriptionId: string) {
    const userExists = await this.repository.userExists(userId);
    if (!userExists) {
      throw createHttpError(404, "Usuário não encontrado");
    }

    const subscription = await this.repository.findSubscriptionById(
      subscriptionId,
      userId
    );
    if (!subscription || subscription.userId !== userId) {
      throw createHttpError(
        404,
        "Assinatura não encontrada ou não pertence ao usuário"
      );
    }

    try {
      const canceledSubscription = await clientStripe.subscriptions.update(
        subscriptionId,
        {
          cancel_at_period_end: true,
        }
      );

      return canceledSubscription;
    } catch (error: any) {
      throw new Error(`Erro ao cancelar a assinatura: ${error.message}`);
    }
  }
}
