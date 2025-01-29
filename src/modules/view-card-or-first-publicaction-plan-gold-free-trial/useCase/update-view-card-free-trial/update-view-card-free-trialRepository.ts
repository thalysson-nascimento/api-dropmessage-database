import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class UpdateViewCardFreeTrialRepository {
  async userExist(userId: string) {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }
  async updateViewCardFreeTrial(userId: string) {
    return prisma.viewCardOrFirstPublicationPlanGoldFreeTrial.updateMany({
      data: {
        viewCardFreeTrial: true,
      },
      where: {
        userId,
      },
    });
  }
}
