import * as fs from "fs";
import * as handlebars from "handlebars";
import nodemailer, { Transporter } from "nodemailer";
import * as path from "path";
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

  private compileTemplate(templateName: string, variables: object): string {
    // Caminho absoluto para a raiz do projeto
    const rootPath = path.resolve(__dirname, "../../");

    // Caminho do template na raiz do projeto
    const templatePath = path.resolve(
      rootPath,
      "template-email",
      `${templateName}.hbs`
    );

    console.log("Caminho do template utilizado:", templatePath);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template não encontrado: ${templatePath}`);
    }

    // Carrega e compila o template
    const templateSource = fs.readFileSync(templatePath, "utf-8");
    const compiledTemplate = handlebars.compile(templateSource);
    return compiledTemplate(variables);
  }
  async sendVerificationEmail(email: string, name: string, codeEmail: number) {
    try {
      const openUrlApp = `datingmatch://home/verify-token-email`;

      const htmlContent = this.compileTemplate("email-confirmation-code", {
        name,
        openUrlApp,
        codeEmail,
      });

      await this.transporter.sendMail({
        from: env.SMTP_FROM_EMAIL,
        to: email,
        subject: "Verificação de Email DatingMatch",
        html: htmlContent,
      });
    } catch (error) {
      console.log("=====================================");
      console.log(error);
      throw new Error("Falha no envio do e-mail de verificação.");
    }
  }
}
