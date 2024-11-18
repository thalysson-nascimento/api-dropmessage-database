import crypto from "crypto";

export function generateUniqueHash(): string {
  const randomValue = crypto.randomBytes(16).toString("hex"); // Gera um valor aleatório
  const timestamp = Date.now().toString(); // Adiciona o timestamp para garantir unicidade
  const combinedValue = randomValue + timestamp;
  return crypto
    .createHash("sha256")
    .update(combinedValue)
    .digest("hex")
    .substring(0, 10);
}
