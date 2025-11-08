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
    const rootPath = path.resolve(__dirname, "../../");

    const templatePath = path.resolve(
      rootPath,
      "template-email",
      `${templateName}.hbs`
    );

    if (!fs.existsSync(templatePath)) {
      console.log("Template não encontrado", templatePath);
      throw new Error(`Template não encontrado: ${templatePath}`);
    }

    const templateSource = fs.readFileSync(templatePath, "utf-8");
    const compiledTemplate = handlebars.compile(templateSource);
    return compiledTemplate(variables);
  }
  async sendVerificationEmail(email: string, name: string, codeEmail: number) {
    console.log(
      "================= Dados de envio de email para serem enviados =================="
    );
    console.log("email", email);
    console.log("name", name);
    console.log("codeEmail", codeEmail);
    console.log("env.SMTP_FROM_EMAIL", env.SMTP_FROM_EMAIL);
    console.log("===========================================================");

    try {
      console.log(
        "================= Enviados dados de envio de email =================="
      );
      console.log("email", email);
      console.log("name", name);
      console.log("codeEmail", codeEmail);
      console.log("env.SMTP_FROM_EMAIL", env.SMTP_FROM_EMAIL);
      console.log(
        "==========================================================="
      );

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
      throw new Error("Falha no envio do e-mail de verificação.");
    }
  }
}
