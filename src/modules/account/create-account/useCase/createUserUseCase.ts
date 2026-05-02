import { hash } from "bcrypt";
import createHttpError from "http-errors";
import clientStripe from "../../../../config/stripe.config";
import { prismaCliente } from "../../../../database/prismaCliente";
import { UserDataEnum } from "../../../../enums/user-data.enum";
import { UserRedisInitializer } from "../../../../service/user-redis-inicialize";
import { GenerateCodeEmail } from "../../../../utils/generateCodeEmail";
import { SendMailer } from "../../../../utils/sendMailler";

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
    const hashPassword = password ? await hash(password, 10) : null;
    const initializerRedis = new UserRedisInitializer();

    const user = await prismaCliente.user.create({
      data: { name, email, userHashPublic, password: hashPassword },
    });

    await initializerRedis.initialize(user.id);
    await this.createLanguage(user.id, {
      language,
      codeLanguage,
      countryLanguage,
    });

    await Promise.all([
      this.createRewardTracking(user.id),
      this.createEmailConfirmation(user),
      this.createOrAttachStripeCustomer(user),
    ]);

    await this.ensureEmailIsAvailable(email.toLowerCase());
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
    await mailer.sendVerificationEmail(
      user.email.toLowerCase(),
      user.name,
      code,
    );
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

  private async createRewardTracking(userId: string) {
    await prismaCliente.rewardTracking.create({
      data: {
        userId,
        totalLikes: UserDataEnum.FREE_LIKE_LIMIT_POST_MESSAGE,
        rewardWatchCount: UserDataEnum.MAX_VIDEO_REWARDS,
      },
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

  private async createLanguage(userId: string, data: any) {
    await prismaCliente.language.create({
      data: {
        userId,
        name: data.language,
        code: data.codeLanguage,
        country: data.countryLanguage,
      },
    });
  }
}
