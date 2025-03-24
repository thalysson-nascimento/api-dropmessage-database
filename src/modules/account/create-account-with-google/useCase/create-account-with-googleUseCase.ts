import { PrismaClient } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import createHttpError from "http-errors";
import { sign } from "jsonwebtoken";
import clientStripe from "../../../../config/stripe.config";
import { prismaCliente } from "../../../../database/prismaCliente";
import { client as redisClient } from "../../../../lib/redis";
import { generateUniqueHash } from "../../../../utils/generateUserHasPublic";
import { PlanGoldFreeTrial } from "../../../../utils/planGoldFreeTrial";
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
      throw createHttpError(401, "Invalid token.");
    }

    const { sub, name, email, picture, exp } = payload;

    // Verifica se o token já expirou
    const now = Math.floor(Date.now() / 1000);
    if (exp && exp < now) {
      throw createHttpError(401, "Token expirado.");
    }

    if (!name) {
      throw createHttpError(400, "Nome é obrigatório.");
    }

    if (!email) {
      throw createHttpError(400, "Email é obrigatório.");
    }

    if (!picture) {
      throw createHttpError(400, "Foto é obrigatória.");
    }

    const emailUserAdmin = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (emailUserAdmin) {
      throw createHttpError(409, "Usuário existente");
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
        StripeSignature: {
          select: {
            status: true,
          },
        },
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
        expiresIn: "7d",
      }
    );

    const planGoldFreeTrial = new PlanGoldFreeTrial();
    const goldFreeTrialData = await planGoldFreeTrial.createPlanGoldFreeTrial(
      userClient.id
    );

    // const userStripeId = await this.createStripeUserCustomerID(name, email);

    // await prismaCliente.userStripeCustomersId.create({
    //   data: {
    //     userId: userClient.id,
    //     customerId: userStripeId.id,
    //   },
    // });

    let userStripeCustomer =
      await prismaCliente.userStripeCustomersId.findUnique({
        where: { userId: userClient.id },
      });

    if (!userStripeCustomer) {
      // Se não existir, cria um novo customerId no Stripe
      const userStripeId = await this.createStripeUserCustomerID(name, email);

      // Salva o novo customerId no banco
      userStripeCustomer = await prismaCliente.userStripeCustomersId.create({
        data: {
          userId: userClient.id,
          customerId: userStripeId.id,
        },
      });
    }

    return {
      token,
      expiresIn: "7d",
      statusSignature: !!userClient?.StripeSignature?.some(
        (s) => s.status === "active" || s.status === "trialing"
      ),
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

  async createStripeUserCustomerID(name: string, email: string) {
    return await clientStripe.customers.create({
      email: email,
      name: name,
    });
  }
}
