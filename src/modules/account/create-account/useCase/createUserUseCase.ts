import { hash } from "bcrypt";
import createHttpError from "http-errors";
import clientStripe from "../../../../config/stripe.config";
import { prismaCliente } from "../../../../database/prismaCliente";
import { client as redisClient } from "../../../../lib/redis";
import { GenerateCodeEmail } from "../../../../utils/generateCodeEmail";
import { PlanGoldFreeTrial } from "../../../../utils/planGoldFreeTrial";
import { SendMailer } from "../../../../utils/sendMailler";

interface CreateUserAdmin {
  name: string;
  email: string;
  password?: string;
  userHashPublic: string;
}

export class CreateUserUseCase {
  async execute({ name, email, userHashPublic, password }: CreateUserAdmin) {
    await this.ensureEmailIsAvailable(email);

    const hashPassword = password ? await hash(password, 10) : null;

    const user = await prismaCliente.user.create({
      data: { name, email, userHashPublic, password: hashPassword },
    });

    await Promise.all([
      this.createRewardTracking(user.id),
      this.initializeUserRedisKeys(user.id),
      // this.createEmailConfirmation(user),
      this.createOrAttachStripeCustomer(user),
      new PlanGoldFreeTrial().createPlanGoldFreeTrial(user.id),
    ]);

    return this.formatResponse(user);
  }

  private async ensureEmailIsAvailable(email: string) {
    const existingUser = await prismaCliente.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (existingUser) {
      throw createHttpError.Conflict("O email informado já está em uso.");
    }
  }

  private async createEmailConfirmation(user: {
    id: string;
    email: string;
    name: string;
  }) {
    const code = GenerateCodeEmail.generateCode();

    await prismaCliente.codeConfirmationEmail.create({
      data: { userId: user.id, codeConfirmation: code },
    });

    const mailer = new SendMailer();
    await mailer.sendVerificationEmail(user.email, user.name, code);
  }

  private async initializeUserRedisKeys(userId: string) {
    const prefix = (key: string) => `${key}:${userId}`;
    const keys = {
      [prefix("countLikePostMessage")]: "0",
      [prefix("mustVideoWatch")]: "false",
      [prefix("userPlanSubscription")]: "free",
      [prefix("userLimiteLikePostMessage")]: "0",
    };

    await Promise.all(
      Object.entries(keys).map(([key, value]) =>
        redisClient.set(key, value, { NX: true })
      )
    );

    console.log("✅ Chaves Redis iniciais criadas com sucesso.");
  }

  private async createOrAttachStripeCustomer(user: {
    id: string;
    name: string;
    email: string;
  }) {
    let stripeUser = await prismaCliente.userStripeCustomersId.findUnique({
      where: { userId: user.id },
    });

    if (!stripeUser) {
      const stripeCustomer = await clientStripe.customers.create({
        email: user.email,
        name: user.name,
      });

      stripeUser = await prismaCliente.userStripeCustomersId.create({
        data: {
          userId: user.id,
          customerId: stripeCustomer.id,
        },
      });
    }

    console.log(
      `✅ Stripe customer criado com sucesso id: ${stripeUser.customerId}`
    );

    return stripeUser;
  }

  private async createRewardTracking(userId: string) {
    await prismaCliente.rewardTracking.create({
      data: { userId, totalLikes: 0 },
    });
  }

  private formatResponse(user: any) {
    const {
      id,
      name,
      email,
      userHashPublic,
      createdAt,
      isUploadAvatar,
      verificationTokenEmail,
    } = user;

    return {
      id,
      name,
      email,
      userHashPublic,
      createdAt,
      isUploadAvatar,
      verificationTokenEmail,
    };
  }
}
