import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class CreateSessionStripePaymentRepository {
  async get() {
    return {};
  }

  async userExists(userId: string) {
    return await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async createAsignatureStripe() {}

  async findActivitySubscriptionById(userId: string) {
    return await prisma.stripeSignature.findFirst({
      where: {
        userId: userId,
        cancelAtPeriodEnd: false,
      },
    });
  }

  async productActive() {}
}
