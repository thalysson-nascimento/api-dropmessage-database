import { compare } from "bcrypt";
import createHttpError from "http-errors";
import { sign } from "jsonwebtoken";
import { prismaCliente } from "../../../../database/prismaCliente";
import { client as redisClient } from "../../../../lib/redis";
import { PlanGoldFreeTrial } from "../../../../utils/planGoldFreeTrial";

interface AuthUserAdmin {
  email: string;
  password?: string;
}

export class AuthUserUseCase {
  async execute({ email, password }: AuthUserAdmin) {
    const userAdmin = await prismaCliente.user.findFirst({
      where: { email },
    });

    if (!userAdmin) {
      throw createHttpError(
        404,
        "Email ou password não confere, tente novamente!"
      );
    }

    const emailUnavailable = await prismaCliente.user.findFirst({
      where: {
        email,
        isDeactivated: true,
      },
    });

    if (emailUnavailable) {
      throw createHttpError(404, "Email indisponível!");
    }

    if (userAdmin.password && password) {
      const passwordMacth = await compare(password, userAdmin.password);
      if (!passwordMacth) {
        throw createHttpError(
          401,
          "Email ou password não confere, tente novamente!"
        );
      }
    }

    const token = sign(
      { email },
      "dff2f370b3331305c51daafbdf7d2b6e-user-admin",
      {
        subject: userAdmin.id,
        expiresIn: "7d",
      }
    );

    const userClient = await prismaCliente.user.findFirst({
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

    if (!userClient) {
      throw createHttpError(404, "Usuário não encontrado.");
    }

    const planGoldFreeTrial = new PlanGoldFreeTrial();
    const goldFreeTrialData = await planGoldFreeTrial.activePlan(userClient.id);

    const redisKeyCountLikePostMessage = `countLikePostMessage:${userClient.id}`;
    const redisKeyMustVideoWatch = `mustVideoWatch:${userClient.id}`;
    const redisUserPlanSubscription = `userPlanSubscription:${userClient.id}`;
    const redisUserLimiteLikePostMessage = `userLimiteLikePostMessage:${userClient.id}`;
    await redisClient.set(redisKeyCountLikePostMessage, "0", {
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

    await this.registerLoggedUser(userClient.id);

    return {
      token,
      expiresIn: "7d",
      statusSignature: !!userClient?.StripeSignature?.some(
        (s) => s.status === "active" || s.status === "trialing"
      ),
      userVerificationData: {
        userHashPublic: userClient?.userHashPublic,
        isUploadAvatar: userClient?.isUploadAvatar,
        verificationTokenEmail: userClient?.verificationTokenEmail,
        validatorLocation: userClient?.validatorLocation,
      },
      avatar: {
        image: userClient?.avatar?.image,
        createdAt: userClient?.avatar?.createdAt,
        user: {
          name: userClient?.name,
          email: userClient?.email,
        },
      },
      goldFreeTrialData,
    };
  }

  async registerLoggedUser(userId: string) {
    await prismaCliente.loggedUsers.create({
      data: {
        userId,
      },
    });
  }
}
