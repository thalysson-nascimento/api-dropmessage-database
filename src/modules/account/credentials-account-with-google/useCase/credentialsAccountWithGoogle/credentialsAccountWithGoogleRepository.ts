import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

export class CredentialsAccountWithGoogleRepository {
  async get() {
    // Implemente a lógica aqui
    return {};
  }

  async registerLoggedUser(userId: string) {
    await prismaClient.loggedUsers.create({
      data: {
        userId,
      },
    });
  }
}
