import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class FisrtPublicationRegisterGoldFreeRepository {
  async updateFirstPublication(userId: string) {
    return prisma.viewCardOrFirstPublicationPlanGoldFreeTrial.updateMany({
      data: {
        firstPublicationPostMessage: true,
      },
      where: {
        userId,
      },
    });
  }

  async userStripeCustomerrId(userId: string) {
    return prisma.userStripeCustomersId.findFirst({
      where: {
        userId,
      },
      select: {
        customerId: true,
      },
    });
  }

  async activeSubscriptionGoldFreeTrial() {
    return prisma.adminActivePlanGoldFreeTrial.findFirst();
  }

  async findUserActivePlanGoldFreeTrial(userId: string) {
    return prisma.subscriptionGoldFreeTrial.findFirst({
      where: {
        userId,
      },
    });
  }

  async subscriptionGoldFreeTrial(userId: string) {
    return prisma.subscriptionGoldFreeTrial.create({
      data: {
        userId,
      },
      select: {
        createdAt: true,
      },
    });
  }
}
