import { hash } from "bcrypt";
import createHttpError from "http-errors";
import clientStripe from "../../../../config/stripe.config";
import { prismaCliente } from "../../../../database/prismaCliente";
import { UserDataEnum } from "../../../../enums/user-data.enum";
import { CreateCodeConfirmationEmail } from "../../../../service/createCodeConfirmationEmail";
import { UserRedisInitializer } from "../../../../service/user-redis-inicialize";

interface CreateUserAdmin {
  name: string;
  email: string;
  password?: string;
  userHashPublic: string;
  language: string;
  codeLanguage: string;
  countryLanguage: string;
}

export class CreateUserUseCase {
  async execute({
    name,
    email,
    userHashPublic,
    password,
    language,
    codeLanguage,
    countryLanguage,
  }: CreateUserAdmin) {
    const normalizedEmail = email.toLowerCase();

    // ✅ 1. valida ANTES de tudo
    await this.ensureEmailIsAvailable(normalizedEmail);

    const hashPassword = password ? await hash(password, 10) : null;

    const initializerRedis = new UserRedisInitializer();
    const confirmationCodeEmail = new CreateCodeConfirmationEmail();

    // ✅ 2. transaction SOMENTE banco
    const user = await prismaCliente.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          userHashPublic,
          password: hashPassword,
          validatorLocation: true,
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

    // ✅ 3. redis (pode ser fora)
    await initializerRedis.initialize(user.id);

    // ✅ 4. email NÃO bloqueante
    // void confirmationCodeEmail.codeConfirmation(user);

    // ✅ 5. stripe NÃO quebra fluxo
    this.createOrAttachStripeCustomer(user).catch((err) => {
      console.error("❌ Stripe error:", err);
    });

    return this.formatResponse(user);
  }

  private async ensureEmailIsAvailable(email: string) {
    const existingUser = await prismaCliente.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (existingUser) {
      throw createHttpError.Conflict("The email is already in use.");
    }
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
        email: user.email.toLowerCase(),
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
      `✅ Stripe customer criado com sucesso id: ${stripeUser.customerId}`,
    );

    return stripeUser;
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
