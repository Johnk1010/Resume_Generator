import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  JWT_ACCESS_SECRET: z.string().min(16).default("local_dev_jwt_secret_12345"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(14),
  WEB_URL: z.string().url().default("http://localhost:5173"),
  PUPPETEER_EXECUTABLE_PATH: z.string().optional()
});

export const env = envSchema.parse(process.env);

