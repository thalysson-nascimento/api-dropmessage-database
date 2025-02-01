import { PrismaClient } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import createHttpError from "http-errors";
import { sign } from "jsonwebtoken";
import { generateUniqueHash } from "../../../../utils/generateUserHasPublic";
import { CreateUserUseCase } from "../../create-account/useCase/createUserUseCase";
import { CreateAccountWithGoogleRepository } from "./create-account-with-googleRepository";

const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class CreateAccountWithGoogleUseCase {
  private repository: CreateAccountWithGoogleRepository;

  constructor() {
    this.repository = new CreateAccountWithGoogleRepository();
  }

  async execute(tokenGoogleOAuth: string) {
    const ticket = await client.verifyIdToken({
      idToken: tokenGoogleOAuth,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw createHttpError(401, "Token invalido");
    }

    const { sub, name, email, picture } = payload;

    if (!name) {
      throw createHttpError(400, "Name is required for user creation.");
    }

    if (!email) {
      throw createHttpError(400, "Email is required for user creation.");
    }

    if (!picture) {
      throw createHttpError(400, "Picture is required for user creation.");
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      throw createHttpError(409, "User already exists");
    }

    const createUserUseCase = new CreateUserUseCase();

    await createUserUseCase.execute({
      name,
      email,
      userHashPublic: generateUniqueHash(),
    });

    const userClient = await prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        userHashPublic: true,
        isUploadAvatar: true,
        verificationTokenEmail: true,
        validatorLocation: true,
        ActivePlanGolFreeTrial: true,
        SubscriptionPlanGoldFreeTrial: {
          select: {
            firstPublicationPostMessage: true,
            viewCardFreeTrial: true,
          },
        },
        avatar: {
          select: {
            image: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!userClient?.id) {
      throw createHttpError(404, "User not found");
    }

    await this.repository.createOAuthUser(
      sub,
      "google",
      userClient.id,
      picture
    );

    const token = sign(
      { email },
      "dff2f370b3331305c51daafbdf7d2b6e-user-admin",
      {
        subject: userClient.id,
        expiresIn: "1d",
      }
    );

    // const planGoldFreeTrial = new PlanGoldFreeTrial();

    // const goldFreeTrialData = await planGoldFreeTrial.activePlan(userClient.id);
    const goldFreeTrialData = null;
    return {
      token,
      expiresIn: "1d",
      userVerificationData: {
        userHashPublic: userClient.userHashPublic,
        isUploadAvatar: userClient.isUploadAvatar,
        verificationTokenEmail: userClient.verificationTokenEmail,
        validatorLocation: userClient.validatorLocation,
      },
      avatar: {
        image: userClient?.avatar?.image,
        createdAt: userClient?.avatar?.createdAt,
        user: {
          name: userClient.name,
          email: userClient.email,
        },
      },
      goldFreeTrialData,
    };
  }
}
