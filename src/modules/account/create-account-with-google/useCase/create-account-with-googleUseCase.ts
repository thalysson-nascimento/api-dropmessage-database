import { OAuth2Client } from "google-auth-library";
import createHttpError from "http-errors";
import { sign } from "jsonwebtoken";
import clientStripe from "../../../../config/stripe.config";
import { prismaCliente } from "../../../../database/prismaCliente";
import { getImageUrl } from "../../../../service/cloudinary.service";
import { UserRedisInitializer } from "../../../../service/user-redis-inicialize";
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
    console.log("GOOGLE AUTH START");

    const initializerRedis = new UserRedisInitializer();

    // =========================
    // VERIFY TOKEN
    // =========================

    console.log("VERIFYING TOKEN...");

    const ticket = await client.verifyIdToken({
      idToken: tokenGoogleOAuth,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    console.log("TOKEN VERIFIED");

    const payload = ticket.getPayload();

    console.log("PAYLOAD:", payload);

    if (!payload) {
      throw createHttpError(401, "Invalid token.");
    }

    const { sub, name, email, picture, exp } = payload;

    // =========================
    // VALIDATIONS
    // =========================

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

    // =========================
    // SEARCH USER
    // =========================

    console.log("SEARCH USER EMAIL:", email);

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

    console.log("USER FOUND:", userClient);

    // =========================
    // CREATE ACCOUNT IF NOT EXISTS
    // =========================

    if (!userClient) {
      console.log("USER NOT FOUND, CREATING ACCOUNT...");

      // const createUserUseCase = new CreateUserUseCase();

      // await createUserUseCase.execute({
      //   name,
      //   email,
      //   userHashPublic: generateUniqueHash(),
      //   language,
      //   codeLanguage,
      //   countryLanguage,
      // });
      await this.repository.createAccountWithGoogle(
        name,
        email,
        language,
        codeLanguage,
        countryLanguage,
      );

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
        throw createHttpError(404, "User not found.");
      }
    }

    // =========================
    // INITIALIZE REDIS
    // =========================

    console.log("INITIALIZING REDIS...");

    await initializerRedis.initialize(userClient.id);

    // =========================
    // CREATE OAUTH USER IF NOT EXISTS
    // =========================

    console.log("SEARCHING OAUTH USER...");

    const oauthUser = await prismaCliente.oAuthUser.findFirst({
      where: {
        sub,
        providerId: "google",
      },
    });

    if (!oauthUser) {
      console.log("CREATING OAUTH USER...");

      await this.repository.createOAuthUser(
        sub,
        "google",
        userClient.id,
        picture,
      );
    }

    // =========================
    // GENERATE JWT
    // =========================

    console.log("GENERATING JWT...");

    const token = sign(
      {
        email,
      },

      process.env.JWT_SECRET || "dff2f370b3331305c51daafbdf7d2b6e-user-admin",

      {
        subject: userClient.id,
        expiresIn: "7d",
      },
    );

    // =========================
    // STRIPE CUSTOMER
    // =========================

    console.log("SEARCHING STRIPE CUSTOMER...");

    let userStripeCustomer =
      await prismaCliente.userStripeCustomersId.findUnique({
        where: {
          userId: userClient.id,
        },
      });

    if (!userStripeCustomer) {
      console.log("CREATING STRIPE CUSTOMER...");

      const userStripeId = await this.createStripeUserCustomerID(name, email);

      userStripeCustomer = await prismaCliente.userStripeCustomersId.create({
        data: {
          userId: userClient.id,
          customerId: userStripeId.id,
        },
      });
    }

    // =========================
    // REGISTER LOGGED USER
    // =========================

    console.log("REGISTERING LOGGED USER...");

    await prismaCliente.loggedUsers.upsert({
      where: {
        userId: userClient.id,
      },

      update: {
        updatedAt: new Date(),
      },

      create: {
        userId: userClient.id,
      },
    });

    // =========================
    // SUCCESS
    // =========================

    console.log("GOOGLE AUTH SUCCESS");

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
        image: getImageUrl(userClient?.avatar?.image || ""),
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
