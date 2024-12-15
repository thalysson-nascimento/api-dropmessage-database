import jwt from "jsonwebtoken";
import nodemailer, { Transporter } from "nodemailer";
import { env } from "../env";

export class SendMailer {
  private transporter!: Transporter;

  constructor() {
    this.configNodeMailer();
  }

  private configNodeMailer() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: env.SMTP_USER_CONFIG,
        pass: env.SMPT_PASSWORD_CONFIG,
      },
    });
  }

  private generateVerificationToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET as string, {
      expiresIn: "1d",
    });
  }

  async sendVerificationEmail(
    email: string,
    userId: string,
    name: string,
    codeEmail: number
  ) {
    try {
      const verificationToken = this.generateVerificationToken(userId);

      const verificationUrl = `datingmatch://home/verify-token-email`;

      await this.transporter.sendMail({
        from: env.SMTP_FROM_EMAIL,
        to: email,
        subject: "Verificação de Email DatingMatch",
        html: `
                <p>Olá, ${name}</p>
                <p>Seja bem-vindo ao DatingMatch!</p>
                <p>Clique no link abaixo para verificar sua conta no DatingMatch:</p>
                <p>Para confirmar o seu cadastro insira o código de verificação ${codeEmail}.</p>
                <p><a href="${verificationUrl}">Verificar Conta</a></p>
                <p>Se você não criou essa conta, ignore este e-mail.</p>
            `,
      });
    } catch (error) {
      throw new Error("Falha no envio do e-mail de verificação.");
    }
  }
}
