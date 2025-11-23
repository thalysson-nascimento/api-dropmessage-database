import * as fs from "fs";
import * as handlebars from "handlebars";
import * as path from "path";
import { env } from "../env";

import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
} from "@getbrevo/brevo";

export class SendMailer {
  private brevoClient!: TransactionalEmailsApi;

  constructor() {
    this.configBrevo();
  }

  private configBrevo() {
    console.log("🔑 BREVO_API_KEY carregada:", !!env.BREVO_API_KEY);

    try {
      const client = new TransactionalEmailsApi();

      client.setApiKey(TransactionalEmailsApiApiKeys.apiKey, env.BREVO_API_KEY);

      this.brevoClient = client;

      console.log("📨 Brevo API configurada com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao configurar Brevo API:", error);
    }
  }

  private compileTemplate(templateName: string, variables: object): string {
    const rootPath = path.resolve(__dirname, "../../");

    const templatePath = path.resolve(
      rootPath,
      "template-email",
      `${templateName}.hbs`
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template não encontrado: ${templatePath}`);
    }

    const source = fs.readFileSync(templatePath, "utf-8");
    const template = handlebars.compile(source);

    return template(variables);
  }

  async sendVerificationEmail(email: string, name: string, codeEmail: number) {
    console.log("📨 Tentando enviar e-mail pela Brevo...");

    if (!this.brevoClient) {
      throw new Error("❌ Brevo client não inicializado!");
    }

    try {
      const htmlContent = this.compileTemplate("email-confirmation-code", {
        name,
        codeEmail,
      });

      const result = await this.brevoClient.sendTransacEmail({
        sender: {
          email: env.SMTP_FROM_EMAIL,
          name: "DatingMatch",
        },
        to: [{ email, name }],
        subject: "Verificação de Email — DatingMatch",
        htmlContent,
        textContent: `Seu código é: ${codeEmail}`,
      });

      console.log("📨 Email enviado com sucesso!", result.body);
      return result;
    } catch (error) {
      console.error("❌ ERRO ENVIO:", error);
      throw new Error("Falha ao enviar email.");
    }
  }
}
