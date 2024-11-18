import { hash } from "bcrypt";
import createHttpError from "http-errors";
import { prismaCliente } from "../../../../database/prismaCliente";
import { SendMailer } from "../../../../utils/sendMailler";

interface CreateUserAdmin {
  name: string;
  email: string;
  password: string;
  userHashPublic: string;
}

export class CreateUserUseCase {
  async execute({ name, email, userHashPublic, password }: CreateUserAdmin) {
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
      data: { name, email, userHashPublic, password: hashPassword },
    });

    // await createTokenMaillerUseCase.execute(email, userAdmin.id);
    const sendMailer = new SendMailer();
    await sendMailer.sendVerificationEmail(email, userAdmin.id);

    // console.log("generateUniqueHash() -==", generateUniqueHash());

    const responseUserAdmin = {
      name: userAdmin.name,
      email: userAdmin.email,
      userHashPublic,
      createdAt: userAdmin.createdAt,
      isUploadAvatar: userAdmin.isUploadAvatar,
      verificationTokenEmail: userAdmin.verificationTokenEmail,
    };

    return responseUserAdmin;
  }
}
