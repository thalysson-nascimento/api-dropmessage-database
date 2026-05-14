import { PrismaClient } from "@prisma/client";
import { UserDataEnum } from "../../../../enums/user-data.enum";
import { generateUniqueHash } from "../../../../utils/generateUserHasPublic";

const prismaClient = new PrismaClient();

export class CreateAccountWithGoogleRepository {
  async createOAuthUser(
    sub: string,
    providerId: string,
    userId: string,
    picture: string,
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

  async createAccountWithGoogle(
    name: string,
    email: string,
    language: string,
    codeLanguage: string,
    countryLanguage: string,
  ) {
    const normalizedEmail = email.toLowerCase();
    const hashPassword = null;

    return await prismaClient.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          userHashPublic: generateUniqueHash(),
          password: hashPassword,
          verificationTokenEmail: true,
        },
      });

      await tx.language.create({
        data: {
          userId: user.id,
          name: language,
          code: codeLanguage,
          country: countryLanguage,
        },
      });

      await tx.rewardTracking.create({
        data: {
          userId: user.id,
          totalLikes: UserDataEnum.FREE_LIKE_LIMIT_POST_MESSAGE,
          rewardWatchCount: UserDataEnum.MAX_VIDEO_REWARDS,
        },
      });

      return user;
    });
  }
}
