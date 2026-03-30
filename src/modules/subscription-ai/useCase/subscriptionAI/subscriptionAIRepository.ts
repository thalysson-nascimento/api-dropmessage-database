import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class SubscriptionAIRepository {
  async get() {
    // Implemente a lógica aqui
    return {};
  }

  async getUserCurrency(userId: string) {
    return await prisma.userLocation.findFirst({
      where: {
        userId: {
          equals: userId,
        },
      },
      select: {
        currency: true,
      },
    });
  }
}
