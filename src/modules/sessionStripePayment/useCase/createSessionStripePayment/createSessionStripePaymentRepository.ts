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

  async findAsignatureStripe(userId: string) {
    return await prisma.stripeSignature.findMany({
      where: {
        userId: userId,
        active: true,
      },
    });
  }

  async productActive() {}
}
