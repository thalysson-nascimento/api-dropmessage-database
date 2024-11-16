import { z } from "zod";

const envSchema = z.object({
  PORT: z.string(),
  PRODUCTION: z.string().transform((val) => val === "false"),
  JWT_SECRET: z.string(),
  BASE_URL: z.string(),
  EMAIL_USER: z.string(),
  SMTP_USER_CONFIG: z.string(),
  SMPT_PASSWORD_CONFIG: z.string(),
  PATH_ORIGIN_APPLICATION_SOCKET: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
  REDIS_PASSWORD: z.string(),
  REDIS_URL: z.string(),
});

export const env = envSchema.parse(process.env);
