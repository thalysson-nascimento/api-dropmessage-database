import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class CancelSubscriptionStripeRepository {
  async userExists(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async findSubscriptionById(subscriptionId: string, userId: string) {
    return await prisma.stripeSignature.findFirst({
      where: {
        subscription: subscriptionId,
        AND: [{ userId: userId }, { cancelAtPeriodEnd: false }],
      },
    });
  }
}
