import jwt from "jsonwebtoken";
import nodemailer, { Transporter } from "nodemailer";
import { env } from "../env"; // Certifique-se de que as variáveis do `.env` estejam configuradas corretamente.

export class SendMailer {
  private transporter!: Transporter;

  constructor() {
    this.configNodeMailer();
  }

  // Configuração do Nodemailer com Brevo (Sendinblue)
  private configNodeMailer() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST, // Servidor SMTP do Brevo
      port: 587, // Porta padrão com STARTTLS habilitado
      secure: false, // False para STARTTLS
      auth: {
        user: env.SMTP_USER_CONFIG, // Usuário SMTP (81db48001@smtp-brevo.com)
        pass: env.SMPT_PASSWORD_CONFIG, // Senha SMTP
      },
    });
  }

  // Geração do token de verificação com JWT
  private generateVerificationToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET as string, {
      expiresIn: "1d", // Expiração do token em 1 dia
    });
  }

  async sendVerificationEmail(email: string, userId: string) {
    try {
      const verificationToken = this.generateVerificationToken(userId);

      const verificationUrl = `datingmatch://home/verify-token-email?token=${verificationToken}`;

      await this.transporter.sendMail({
        from: env.SMTP_FROM_EMAIL,
        to: email,
        subject: "Verificação de Email",
        html: `
                <p>Olá,</p>
                <p>Clique no link abaixo para verificar sua conta:</p>
                <p><a href="${verificationUrl}">Verificar Conta</a></p>
                <p>Se você não criou essa conta, ignore este e-mail.</p>
            `,
      });

      console.log(`E-mail enviado para ${email}`);
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      throw new Error("Falha no envio do e-mail de verificação.");
    }
  }
}
