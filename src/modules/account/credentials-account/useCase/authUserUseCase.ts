import { compare } from "bcrypt";
import createHttpError from "http-errors";
import { sign } from "jsonwebtoken";
import { prismaCliente } from "../../../../database/prismaCliente";

interface AuthUserAdmin {
  email: string;
  password: string;
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

    const passwordMacth = await compare(password, userAdmin.password);

    if (!passwordMacth) {
      throw createHttpError(
        401,
        "Email ou password não confere, tente novamente!"
      );
    }

    const token = sign(
      { email },
      "dff2f370b3331305c51daafbdf7d2b6e-user-admin",
      {
        subject: userAdmin.id,
        expiresIn: "1d",
      }
    );

    const userAdminDetails = await prismaCliente.user.findFirst({
      where: { email },
      select: {
        name: true,
        email: true,
        userHashPublic: true,
        isUploadAvatar: true,
        verificationTokenEmail: true,
        validatorLocation: true,
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

    return {
      token,
      expiresIn: "1d",
      userVerificationData: {
        userHashPublic: userAdminDetails?.userHashPublic,
        isUploadAvatar: userAdminDetails?.isUploadAvatar,
        verificationTokenEmail: userAdminDetails?.verificationTokenEmail,
        validatorLocation: userAdminDetails?.validatorLocation,
      },
      avatar: {
        image: userAdminDetails?.avatar?.image,
        createdAt: userAdminDetails?.avatar?.createdAt,
        user: {
          name: userAdminDetails?.name,
          email: userAdminDetails?.email,
        },
      },
    };
  }
}
