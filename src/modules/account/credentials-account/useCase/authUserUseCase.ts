import { compare } from "bcrypt";
import createHttpError from "http-errors";
import { sign } from "jsonwebtoken";
import { prismaCliente } from "../../../../database/prismaCliente";
import { getImageUrl } from "../../../../service/cloudinary.service";
import { GetLocationByIpService } from "../../../../service/GetLocationByIpService";
import { PlanGoldFreeTrial } from "../../../../utils/planGoldFreeTrial";
import { CreateUserLocationUseCase } from "../../../user-location/create-user-location/useCase/createUserLocationUseCase";

interface AuthUserAdmin {
  email: string;
  password?: string;
  ip: string;
}

export class AuthUserUseCase {
  async execute({ email, password, ip }: AuthUserAdmin) {
    const userAdmin = await prismaCliente.user.findFirst({
      where: { email },
    });

    if (!userAdmin) {
      throw createHttpError(
        404,
        "Email ou password não confere, tente novamente!",
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
          "Email ou password não confere, tente novamente!",
        );
      }
    }

    const token = sign({ email }, process.env.JWT_SECRET as string, {
      subject: userAdmin.id,
      expiresIn: "7d",
    });

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
        UserDescription: {
          select: {
            description: true,
          },
        },
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

    const loggedUser = await this.getLoggedUser(userClient.id);

    if (loggedUser) {
      await this.updatedAtRegisterLoggerdUser(userClient.id);
    } else {
      await this.registerLoggedUser(userClient.id);
    }

    const getLocationByIpService = new GetLocationByIpService();

    const location = await getLocationByIpService.execute(ip);

    const createUserLocationUseCase = new CreateUserLocationUseCase();

    try {
      await createUserLocationUseCase.execute({
        ...location,
        userId: userClient.id,
      });
    } catch {
      // ignore
      console.error("Error creating user location");
    }

    return {
      token,
      expiresIn: "7d",
      statusSignature: !!userClient?.StripeSignature?.some(
        (s) => s.status === "active" || s.status === "trialing",
      ),
      userVerificationData: {
        userHashPublic: userClient?.userHashPublic,
        isUploadAvatar: userClient?.isUploadAvatar,
        verificationTokenEmail: userClient?.verificationTokenEmail,
        bio: !!userClient?.UserDescription?.description,
      },
      avatar: {
        image: getImageUrl(userClient?.avatar?.image ?? ""),
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
    return await prismaCliente.loggedUsers.create({
      data: {
        userId,
      },
    });
  }

  async updatedAtRegisterLoggerdUser(userId: string) {
    return await prismaCliente.loggedUsers.updateMany({
      where: { userId },
      data: { updatedAt: new Date() },
    });
  }

  async getLoggedUser(userId: string) {
    return await prismaCliente.loggedUsers.findFirst({
      where: {
        userId,
      },
    });
  }
}
