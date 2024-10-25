import crypto from "crypto";

const algorithm = "aes-256-ctr";
const secretKey = "your-secret-key";
const key = crypto.createHash("sha256").update(secretKey).digest();
const iv = crypto.randomBytes(16); // Vetor de inicialização (IV) aleatório

// Função para criptografar
export function encrypt(text: string): { iv: string; encryptedData: string } {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return { iv: iv.toString("hex"), encryptedData: encrypted };
}

// Função para descriptografar
export function decrypt(encryptedText: string, iv: string): string {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
}
