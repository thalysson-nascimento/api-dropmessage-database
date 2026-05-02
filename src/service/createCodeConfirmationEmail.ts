import { prismaCliente } from "../database/prismaCliente";
import { GenerateCodeEmail } from "../utils/generateCodeEmail";
import { SendMailer } from "../utils/sendMailler";

export class CreateCodeConfirmationEmail {
  private mailer: SendMailer;

  constructor() {
    this.mailer = new SendMailer();
  }

  async codeConfirmation(user: { id: string; email: string; name: string }) {
    console.log(`📧 Enviando código de confirmação para ${user}`);
    try {
      const code = GenerateCodeEmail.generateCode();

      // ✅ evita múltiplos códigos por usuário
      await prismaCliente.codeConfirmationEmail.upsert({
        where: { userId: user.id },
        update: { codeConfirmation: code },
        create: {
          userId: user.id,
          codeConfirmation: code,
        },
      });

      // ✅ envio de email
      await this.mailer.sendVerificationEmail(
        user.email.toLowerCase(),
        user.name,
        code,
      );

      console.log(`📧 Código enviado para ${user.email}`);
    } catch (error) {
      console.error("❌ Erro ao enviar email de confirmação:", error);
    }
  }
}
