import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_DEV_MODE: z.string().optional().default("true"),
  AUTH_ALLOWED_DOMAIN: z.string().optional().default("chg.co.th"),
  AUTH_SECRET: z.string().min(16).optional().default("importal-dev-secret-key-change-in-prod-32chars"),
  S3_ENDPOINT: z.string().url().optional().default("http://localhost:9010"),
  S3_REGION: z.string().optional().default("ap-southeast-1"),
  S3_BUCKET: z.string().optional().default("importal-files"),
  S3_ACCESS_KEY: z.string().optional().default("importal"),
  S3_SECRET_KEY: z.string().optional().default("importal_secret"),
  S3_FORCE_PATH_STYLE: z.string().optional().default("true"),
  SMTP_HOST: z.string().optional().default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().optional().default(1025),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().optional().default("Importal <no-reply@chg.co.th>"),
  APP_BASE_URL: z.string().url().optional().default("http://localhost:3000"),
  CRON_SECRET: z.string().optional().default("importal-cron-dev-secret"),
});

export function getEnv() {
  return envSchema.parse(process.env);
}

export function isDevAuthEnabled(): boolean {
  if (process.env.AUTH_DEV_MODE === "true") return true;
  if (process.env.AUTH_DEV_MODE === "false") return false;
  return process.env.NODE_ENV !== "production";
}
