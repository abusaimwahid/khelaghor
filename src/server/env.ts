import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(16),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  STORAGE_DRIVER: z.enum(["local", "cloudinary", "s3", "r2"]).default("local"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  STORAGE_MAX_FILE_SIZE_MB: z.coerce.number().positive().default(5),
  SSLCOMMERZ_MODE: z.enum(["sandbox", "live", "mock"]).default("mock"),
  SSLCOMMERZ_STORE_ID: z.string().optional(),
  SSLCOMMERZ_STORE_PASSWORD: z.string().optional(),
  COURIER_PROVIDER: z
    .enum(["mock", "pathao", "steadfast", "redx", "paperfly"])
    .default("mock"),
  EMAIL_PROVIDER: z.enum(["dev", "resend"]).default("dev"),
  EMAIL_FROM: z.string().default("KhelaGhor <hello@khelaghor.example>"),
  RESEND_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
});

export function getEnv() {
  const parsed = envSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    STORAGE_DRIVER: process.env.STORAGE_DRIVER || "local",
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    STORAGE_MAX_FILE_SIZE_MB: process.env.STORAGE_MAX_FILE_SIZE_MB,
    SSLCOMMERZ_MODE: process.env.SSLCOMMERZ_MODE || "mock",
    SSLCOMMERZ_STORE_ID: process.env.SSLCOMMERZ_STORE_ID,
    SSLCOMMERZ_STORE_PASSWORD: process.env.SSLCOMMERZ_STORE_PASSWORD,
    COURIER_PROVIDER: process.env.COURIER_PROVIDER || "mock",
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || "dev",
    EMAIL_FROM: process.env.EMAIL_FROM,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
  });
  return {
    ...parsed,
    siteUrl:
      parsed.NEXT_PUBLIC_SITE_URL ??
      parsed.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000",
  };
}

export function getSiteUrl() {
  return getEnv().siteUrl.replace(/\/$/, "");
}
