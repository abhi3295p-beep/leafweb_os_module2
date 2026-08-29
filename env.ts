import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  APP_URL: z.string().url().optional(),
  FILE_DRIVER: z.enum(["local", "s3", "r2"]).default("local"),
  FILE_LOCAL_DIR: z.string().default("./storage/uploads"),
});

export function getEnv() {
  return envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    APP_URL: process.env.APP_URL,
    FILE_DRIVER: process.env.FILE_DRIVER,
    FILE_LOCAL_DIR: process.env.FILE_LOCAL_DIR,
  });
}

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for database operations.");
  }
  return url;
}
