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
}
