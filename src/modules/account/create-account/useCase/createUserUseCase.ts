import { hash } from "bcrypt";
import createHttpError from "http-errors";
import clientStripe from "../../../../config/stripe.config";
import { prismaCliente } from "../../../../database/prismaCliente";
import { GenerateCodeEmail } from "../../../../utils/generateCodeEmail";
import { SendMailer } from "../../../../utils/sendMailler";

interface CreateUserAdmin {
  name: string;
  email: string;
  password: string;
  userHashPublic: string;
}

export class CreateUserUseCase {
  async execute({ name, email, userHashPublic, password }: CreateUserAdmin) {
    const emailUnavailable = await prismaCliente.user.findFirst({
      where: {
        email,
        isDeactivated: true, // Somente usuários ativos podem logar
      },
    });

    if (emailUnavailable) {
      // Caso não encontre um usuário ativo, lança erro
      throw createHttpError(404, "Email indisponível!");
    }

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

    const codeEmail = GenerateCodeEmail.generateCode();

    await prismaCliente.codeConfirmationEmail.create({
      data: {
        userId: userAdmin.id,
        codeConfirmation: codeEmail,
      },
    });

    const sendMailer = new SendMailer();
    await sendMailer.sendVerificationEmail(email, name, codeEmail);

    const userStripeId = await this.createStripeUserCustomerID(name, email);

    await prismaCliente.userStripeCustomersId.create({
      data: {
        userId: userAdmin.id,
        customerId: userStripeId.id,
      },
    });

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

  async createStripeUserCustomerID(name: string, email: string) {
    return await clientStripe.customers.create({
      email: email,
      name: name,
    });
  }
}
