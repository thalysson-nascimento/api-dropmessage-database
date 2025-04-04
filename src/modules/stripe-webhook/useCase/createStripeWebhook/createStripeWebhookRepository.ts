import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime";

const prisma = new PrismaClient();

export class CreateStripeWebhookRepository {
  async userExists(userId: string) {
    return await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async createAssignaturePlan(
    userId: string,
    priceId: string,
    subscription: string,
    amountPaid: Decimal | string,
    plan: string,
    country: string | null | undefined,
    currency: string,
    status: string,
    currentPeriodStart: number,
    currentPeriodEnd: number,
    description: string,
    colorTop: string,
    colorBottom: string,
    intervalCount: number,
    interval?: string
  ) {
    return await prisma.stripeSignature.create({
      data: {
        userId,
        subscription,
        priceId,
        amountPaid,
        plan,
        country,
        currency,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        description,
        interval,
        colorTop,
        intervalCount,
        colorBottom,
      },
    });
  }

  async cancledAssignaturePlan(
    subscription: string,
    cancelAtPeriodEnd: boolean,
    statusSubscription: string,
    cancelAt: number | null
  ) {
    return await prisma.stripeSignature.update({
      where: {
        subscription,
      },
      data: {
        cancelAtPeriodEnd,
        status: statusSubscription,
        cancelAt,
      },
    });
  }
}
