import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

export class CredentialsAccountWithGoogleRepository {
  async get() {
    // Implemente a lógica aqui
    return {};
  }

  async registerLoggedUser(userId: string) {
    return await prismaClient.loggedUsers.create({
      data: {
        userId,
      },
    });
  }

  async updatedAtRegisterLoggerdUser(userId: string) {
    return await prismaClient.loggedUsers.updateMany({
      where: { userId },
      data: { updatedAt: new Date() },
    });
  }

  async getLoggedUser(userId: string) {
    return await prismaClient.loggedUsers.findFirst({
      where: {
        userId,
      },
    });
  }
}
