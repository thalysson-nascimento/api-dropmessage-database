import { PrismaClient } from "@prisma/client";

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
    idSignature: string,
    priceId: string,
    unitAmountDecimal: string | null,
    plan: string,
    country: string | null | undefined,
    currency: string,
    status: string,
    currentPeriodStart: number,
    currentPeriodEnd: number
  ) {
    return await prisma.stripeSignature.create({
      data: {
        userId,
        idSignature,
        priceId,
        unitAmountDecimal,
        plan,
        country,
        currency,
        status,
        currentPeriodStart,
        currentPeriodEnd,
      },
    });
  }

  async cancledAssignaturePlan(
    idSignature: string,
    cancelAtPeriodEnd: boolean,
    statusSubscription: string,
    cancelAt: number | null
  ) {
    return await prisma.stripeSignature.update({
      where: {
        idSignature,
      },
      data: {
        cancelAtPeriodEnd,
        status: statusSubscription,
        cancelAt,
      },
    });
  }
}
