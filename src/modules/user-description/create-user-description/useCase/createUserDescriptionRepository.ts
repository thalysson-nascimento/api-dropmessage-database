import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class CreateUserDescriptionRepository {
  async createUserDescription(userId: string, userDescription: string) {
    console.log("UserId:", userId); // Deve ser uma string válida
    console.log("UserDescription:", userDescription); // Deve ser uma string válida

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
