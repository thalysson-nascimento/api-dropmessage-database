import { PrismaClient } from "@prisma/client";
import clientStripe from "../../../../config/stripe.config";

const prisma = new PrismaClient();

export class ActiveSubscriptionRepository {
  async activeSubscription(userId: string) {
    return await prisma.stripeSignature.findFirst({
      where: {
        userId: userId,
      },
    });
  }

  async subscriptionById(subscriptionId: string) {
    try {
      const subscription = await clientStripe.subscriptions.retrieve(
        subscriptionId
      );

      const productId = subscription.items.data[0].price.product as string;

      const product = await clientStripe.products.retrieve(productId);

      return {
        ...subscription,
        product,
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar assinatura e produto: ${error.message}`);
    }
  }
}
