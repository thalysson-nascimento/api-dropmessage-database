import { PrismaClient } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import createHttpError from "http-errors";
import { sign } from "jsonwebtoken";
import { client as redisClient } from "../../../../../lib/redis";
import { PlanGoldFreeTrial } from "../../../../../utils/planGoldFreeTrial";
import { CredentialsAccountWithGoogleRepository } from "./credentialsAccountWithGoogleRepository";

const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class CredentialsAccountWithGoogleUseCase {
  private repository: CredentialsAccountWithGoogleRepository;

  constructor() {
    this.repository = new CredentialsAccountWithGoogleRepository();
  }

  async execute(tokenGoogleOAuth: string) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: tokenGoogleOAuth,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw createHttpError(401, "Invalid token.");
      }

      const { email, exp } = payload;

      // Verifica se o token já expirou
      const now = Math.floor(Date.now() / 1000);
      if (exp && exp < now) {
        throw createHttpError(401, "Token expired. Please authenticate again.");
      }

      if (!email) {
        throw createHttpError(400, "Email is required for user creation.");
      }

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

      if (!userClient) {
        throw createHttpError(404, "Usuário não encontrado.");
      }

      const redisKeyCountLikePostMessage = `countLikePostMessage:${userClient.id}`;
      const redisKeyMustVideoWatch = `mustVideoWatch:${userClient.id}`;
      const redisUserPlanSubscription = `userPlanSubscription:${userClient.id}`;
      const redisUserLimiteLikePostMessage = `userLimiteLikePostMessage:${userClient.id}`;
      await redisClient.set(redisKeyCountLikePostMessage, "false", {
        NX: true,
      });
      await redisClient.set(redisKeyMustVideoWatch, "false", {
        NX: true,
      });
      await redisClient.set(redisUserPlanSubscription, "free", {
        NX: true,
      });
      await redisClient.set(redisUserLimiteLikePostMessage, "0", {
        NX: true,
      });

      const token = sign(
        { email },
        "dff2f370b3331305c51daafbdf7d2b6e-user-admin",
        {
          subject: userClient.id,
          expiresIn: "1d",
        }
      );

      const planGoldFreeTrial = new PlanGoldFreeTrial();
      const goldFreeTrialData = await planGoldFreeTrial.activePlan(
        userClient.id
      );

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
    } catch (error) {
      throw Error(
        "Usuário não encontrado, para se autenticar crie sua conta com o Google."
      );
    }
  }
}
