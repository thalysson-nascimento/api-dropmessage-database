import { randomBytes } from "crypto";

export class GenerateCodeEmail {
  static generateCode(): number {
    const randomValue = randomBytes(4).toString("hex");

    const numericValue = parseInt(randomValue, 16);

    const code = numericValue.toString().slice(0, 6);

    return Number(code);
  }
}
