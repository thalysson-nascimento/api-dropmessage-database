import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class CreateAccountWithGoogleRepository {
  async createOAuthUser(
    sub: string,
    providerId: string,
    userId: string,
    picture: string
  ) {
    return await prisma.oAuthUser.create({
      data: {
        sub,
        providerId,
        userId,
        picture,
      },
    });
  }
}
