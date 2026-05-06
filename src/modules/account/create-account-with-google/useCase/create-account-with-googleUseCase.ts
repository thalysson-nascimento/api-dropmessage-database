import { OAuth2Client } from "google-auth-library";
import createHttpError from "http-errors";
import { sign } from "jsonwebtoken";
import clientStripe from "../../../../config/stripe.config";
import { prismaCliente } from "../../../../database/prismaCliente";
import { UserRedisInitializer } from "../../../../service/user-redis-inicialize";
import { generateUniqueHash } from "../../../../utils/generateUserHasPublic";
import { CreateUserUseCase } from "../../create-account/useCase/createUserUseCase";
import { CreateAccountWithGoogleRepository } from "./create-account-with-googleRepository";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class CreateAccountWithGoogleUseCase {
  private repository: CreateAccountWithGoogleRepository;

  constructor() {
    this.repository = new CreateAccountWithGoogleRepository();
  }

  async execute(
    tokenGoogleOAuth: string,
    language: string,
    codeLanguage: string,
    countryLanguage: string,
  ) {
    const initializerRedis = new UserRedisInitializer();

    // Verifica token do Google
    const ticket = await client.verifyIdToken({
      idToken: tokenGoogleOAuth,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw createHttpError(401, "Invalid token.");
    }

    const { sub, name, email, picture, exp } = payload;

    // Verifica expiração
    const now = Math.floor(Date.now() / 1000);

    if (exp && exp < now) {
      throw createHttpError(401, "Expired token.");
    }

    if (!name) {
      throw createHttpError(400, "Name is required.");
    }

    if (!email) {
      throw createHttpError(400, "Email is required.");
    }

    if (!picture) {
      throw createHttpError(400, "Picture is required.");
    }

    // Procura usuário existente
    let userClient = await prismaCliente.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
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

    // Caso usuário NÃO exista → cria conta
    if (!userClient) {
      const createUserUseCase = new CreateUserUseCase();

      await createUserUseCase.execute({
        name,
        email,
        userHashPublic: generateUniqueHash(),
        language,
        codeLanguage,
        countryLanguage,
      });

      // Busca novamente usuário recém criado
      userClient = await prismaCliente.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
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
    }

    // Inicializa Redis
    await initializerRedis.initialize(userClient.id);

    // Verifica se OAuth já existe
    const oauthUser = await prismaCliente.oAuthUser.findFirst({
      where: {
        sub,
        providerId: "google",
      },
    });

    // Só cria se não existir
    if (!oauthUser) {
      await this.repository.createOAuthUser(
        sub,
        "google",
        userClient.id,
        picture,
      );
    }

    // Cria JWT
    const token = sign(
      { email },
      process.env.JWT_SECRET || "dff2f370b3331305c51daafbdf7d2b6e-user-admin",
      {
        subject: userClient.id,
        expiresIn: "7d",
      },
    );

    // Busca customer stripe
    let userStripeCustomer =
      await prismaCliente.userStripeCustomersId.findUnique({
        where: {
          userId: userClient.id,
        },
      });

    // Cria customer stripe caso não exista
    if (!userStripeCustomer) {
      const userStripeId = await this.createStripeUserCustomerID(name, email);

      userStripeCustomer = await prismaCliente.userStripeCustomersId.create({
        data: {
          userId: userClient.id,
          customerId: userStripeId.id,
        },
      });
    }

    // Registra usuário logado
    await this.repository.registerLoggedUser(userClient.id);

    // IMPORTANTE:
    // retorno mantido exatamente como seu front espera
    return {
      token,
      expiresIn: "7d",

      statusSignature: !!userClient?.StripeSignature?.some(
        (s) => s.status === "active" || s.status === "trialing",
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
    };
  }

  async createStripeUserCustomerID(name: string, email: string) {
    return await clientStripe.customers.create({
      email,
      name,
    });
  }
}
