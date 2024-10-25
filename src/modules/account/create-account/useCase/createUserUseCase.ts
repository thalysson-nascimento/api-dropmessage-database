import { hash } from "bcrypt";
import createHttpError from "http-errors";
import { prismaCliente } from "../../../../database/prismaCliente";
import { SendMailer } from "../../../../utils/sendMailler";

interface CreateUserAdmin {
  name: string;
  email: string;
  password: string;
}

export class CreateUserUseCase {
  async execute({ name, email, password }: CreateUserAdmin) {
    const emailUserAdmin = await prismaCliente.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (emailUserAdmin) {
      throw createHttpError(409, "o email informado está em uso, tente outro");
    }

    const hashPassword = await hash(password, 10);
    const userAdmin = await prismaCliente.user.create({
      data: { name, email, password: hashPassword },
    });

    // await createTokenMaillerUseCase.execute(email, userAdmin.id);
    const sendMailer = new SendMailer();
    await sendMailer.sendVerificationEmail(email, userAdmin.id);

    const responseUserAdmin = {
      name: userAdmin.name,
      email: userAdmin.email,
      createdAt: userAdmin.createdAt,
      isUploadAvatar: userAdmin.isUploadAvatar,
      verificationTokenEmail: userAdmin.verificationTokenEmail,
    };

    return responseUserAdmin;
  }
}
