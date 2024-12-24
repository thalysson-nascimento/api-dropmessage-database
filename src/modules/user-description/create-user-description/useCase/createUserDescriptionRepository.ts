import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class CreateUserDescriptionRepository {
  async createUserDescription(userId: string, userDescription: string) {
    return prisma.userDescription.create({
      data: {
        description: userDescription,
        userId: userId,
      },
    });
  }

  async existUserDescription(userId: string) {
    return prisma.userDescription.findFirst({
      where: {
        userId: {
          equals: userId,
        },
      },
    });
  }
}
