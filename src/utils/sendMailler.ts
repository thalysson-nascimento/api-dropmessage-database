import jwt from "jsonwebtoken";
import nodemailer, { Transporter } from "nodemailer";
import { env } from "../env";

export class SendMailer {
  private transporter!: Transporter;

  constructor() {
    this.configNodeMailer();
  }

  configNodeMailer() {
    this.transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: env.SMTP_USER_CONFIG,
        pass: env.SMPT_PASSWORD_CONFIG,
      },
    });
  }

  generateVerificationToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET as string, {
      expiresIn: "1d",
    });
  }

  async sendVerificationEmail(email: string, userId: string) {
    try {
      console.log(email, userId);
      const verificationToken = this.generateVerificationToken(userId);
      const verificationUrl = `${env.BASE_URL}/verify-email?token=${verificationToken}`;

      await this.transporter.sendMail({
        from: "sandbox.smtp.mailtrap.io",
        to: email,
        subject: "Verificação de Email",
        html: `<p>Clique no link para verificar sua conta: <a href="${verificationUrl}">Verificar Conta</a></p>`,
      });
    } catch (error) {
      return error;
    }
  }
}
