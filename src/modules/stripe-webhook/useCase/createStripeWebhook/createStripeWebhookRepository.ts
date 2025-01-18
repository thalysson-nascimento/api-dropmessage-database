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

  async assignaturePlan(
    userId: string,
    idPrice: string,
    plan: string,
    active: boolean,
    dateExpirationPlan: Date,
    unitAmount: string | null,
    currency: string,
    status: boolean
  ) {
    return await prisma.stripeSignature.create({
      data: {
        userId,
        idPrice,
        plan,
        active,
        dateExpirationPlan,
        unitAmount,
        currency,
        status,
      },
    });
  }
}
