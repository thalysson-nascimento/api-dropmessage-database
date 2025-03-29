import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

export class CreateAccountWithGoogleRepository {
  async createOAuthUser(
    sub: string,
    providerId: string,
    userId: string,
    picture: string
  ) {
    return await prismaClient.oAuthUser.create({
      data: {
        sub,
        providerId,
        userId,
        picture,
      },
    });
  }

  async registerLoggedUser(userId: string) {
    await prismaClient.loggedUsers.create({
      data: {
        userId,
      },
    });
  }
}
