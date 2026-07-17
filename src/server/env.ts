import { z } from "zod";

export const envSchema = z
  .object({
    APP_ENV: z
      .enum(["development", "test", "preview", "staging", "production"])
      .default("development"),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
    AUTH_SECRET: z.string().min(16),
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1).optional(),
    STORAGE_DRIVER: z
      .enum(["local", "cloudinary", "s3", "r2"])
      .default("local"),
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
    COURIER_API_KEY: z.string().optional(),
    COURIER_API_SECRET: z.string().optional(),
    COURIER_WEBHOOK_SECRET: z.string().optional(),
    SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
    NEXT_PUBLIC_GTM_ID: z.string().optional(),
    NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    const hosted = ["preview", "staging", "production"].includes(env.APP_ENV);
    const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? env.NEXT_PUBLIC_APP_URL;
    if (
      hosted &&
      (!siteUrl || /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(siteUrl))
    )
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SITE_URL"],
        message:
          "A public HTTPS site URL is required outside local development.",
      });
    if (hosted && siteUrl && !siteUrl.startsWith("https://"))
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SITE_URL"],
        message: "HTTPS is required outside local development.",
      });
    if (hosted && env.STORAGE_DRIVER === "local")
      ctx.addIssue({
        code: "custom",
        path: ["STORAGE_DRIVER"],
        message: "Hosted environments require configured remote storage.",
      });
    if (
      env.STORAGE_DRIVER === "cloudinary" &&
      (!env.CLOUDINARY_CLOUD_NAME ||
        !env.CLOUDINARY_API_KEY ||
        !env.CLOUDINARY_API_SECRET)
    )
      ctx.addIssue({
        code: "custom",
        path: ["STORAGE_DRIVER"],
        message: "Cloudinary mode requires all Cloudinary credentials.",
      });
    if (
      env.SSLCOMMERZ_MODE !== "mock" &&
      (!env.SSLCOMMERZ_STORE_ID || !env.SSLCOMMERZ_STORE_PASSWORD)
    )
      ctx.addIssue({
        code: "custom",
        path: ["SSLCOMMERZ_MODE"],
        message: "SSLCommerz sandbox/live mode requires credentials.",
      });
    if (
      env.COURIER_PROVIDER !== "mock" &&
      (!env.COURIER_API_KEY || !env.COURIER_API_SECRET)
    )
      ctx.addIssue({
        code: "custom",
        path: ["COURIER_PROVIDER"],
        message: "Selected courier mode requires credentials.",
      });
    if (hosted && env.EMAIL_PROVIDER === "dev")
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_PROVIDER"],
        message: "Hosted environments require a configured email provider.",
      });
    if (
      env.EMAIL_PROVIDER === "resend" &&
      (!env.RESEND_API_KEY || /\.example[}>]?$/i.test(env.EMAIL_FROM))
    )
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_PROVIDER"],
        message: "Resend mode requires a key and verified sender.",
      });
  });

export function getEnv() {
  const parsed = envSchema.parse({
    APP_ENV:
      process.env.APP_ENV ||
      (process.env.NODE_ENV === "test" ? "test" : "development"),
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
    COURIER_API_KEY: process.env.COURIER_API_KEY,
    COURIER_API_SECRET: process.env.COURIER_API_SECRET,
    COURIER_WEBHOOK_SECRET: process.env.COURIER_WEBHOOK_SECRET,
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
