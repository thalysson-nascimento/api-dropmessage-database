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
        "Email ou password não conferi, tente novamente!"
      );
    }

    const passwordMacth = await compare(password, userAdmin.password);

    if (!passwordMacth) {
      throw createHttpError(
        401,
        "Email ou password não conferi, tente novamente!"
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
        isUploadAvatar: true,
        verificationTokenEmail: true,
      },
    });

    return {
      token,
      expiresIn: "1d",
      userData: userAdminDetails,
    };
  }
}
