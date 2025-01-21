import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ActiveSubscriptionRepository {
  async activeSubscription(userId: string) {
    return await prisma.stripeSignature.findFirst({
      where: {
        userId: userId,
      },
      select: {
        cancelAt: true,
        cancelAtPeriodEnd: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        status: true,
        subscription: true,
        priceId: true,
        plan: true,
        description: true,
        colorTop: true,
        colorBottom: true,
        amountPaid: true,
        currency: true,
        intervalCount: true,
        interval: true,
      },
    });
  }
}
