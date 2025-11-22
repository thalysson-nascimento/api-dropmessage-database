import * as fs from "fs";
import * as handlebars from "handlebars";
import * as path from "path";
import { env } from "../env";

import Brevo from "@getbrevo/brevo";

export class SendMailer {
  private brevoClient: any;

  constructor() {
    this.configBrevo();
  }

  private configBrevo() {
    console.log(
      "🔑 BREVO_API_KEY carregada:",
      env.BREVO_API_KEY ? "SIM" : "NÃO"
    );

    const apiInstance = new Brevo.TransactionalEmailsApi();

    try {
      test();
      // apiInstance.setApiKey(
      //   Brevo.TransactionalEmailsApiApiKeys.apiKey,
      //   env.BREVO_API_KEY
      // );
      // console.log("📨 Brevo API configurada com sucesso!");
    } catch (err) {
      console.error("❌ Erro ao configurar Brevo API:", err);
    }

    // this.brevoClient iInstance.setApiKey(
    //   Brevo.TransactionalEmailsApiApiKeys.apiKey,
    //   env.BREVO_API_KEY
    // );
    // cons= apiInstance;
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

    const templateSource = fs.readFileSync(templatePath, "utf-8");
    const compiledTemplate = handlebars.compile(templateSource);
    return compiledTemplate(variables);
  }

  async sendVerificationEmail(email: string, name: string, codeEmail: number) {
    console.log("📨 Tentando enviar e-mail pela Brevo...");
    console.log("➡ PARA:", email);
    console.log("➡ FROM:", env.SMTP_FROM_EMAIL);

    try {
      const openUrlApp = `datingmatch://home/verify-token-email`;

      const htmlContent = this.compileTemplate("email-confirmation-code", {
        name,
        openUrlApp,
        codeEmail,
      });

      const result = await this.brevoClient.sendTransacEmail({
        sender: {
          email: env.SMTP_FROM_EMAIL,
          name: "DatingMatch",
        },
        to: [
          {
            email,
            name,
          },
        ],
        subject: "Verificação de Email — DatingMatch",
        htmlContent,
      });

      console.log("📨 Email enviado com sucesso:", result);
      return result;
    } catch (error) {
      console.error("❌ ERRO Brevo API:", error);
      throw new Error(
        "Falha no envio do e-mail de verificação. Veja logs acima."
      );
    }
  }
}
async function test() {
  const client = new Brevo.TransactionalEmailsApi();

  client.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY!
  );

  try {
    const result = await client.sendTransacEmail({
      sender: {
        email: "no-reply@datingmatch.com.br",
        name: "Test Sender",
      },
      to: [
        {
          email: "seuemail@gmail.com", // coloque seu email para teste
          name: "Você",
        },
      ],
      subject: "Teste Brevo API",
      htmlContent: "<h1>Funcionou! 🎉</h1>",
    });

    console.log(result);
  } catch (error) {
    console.error("ERRO:", error);
  }
}
