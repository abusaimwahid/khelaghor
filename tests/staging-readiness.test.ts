import { describe, expect, it, vi } from "vitest";
import { envSchema } from "@/server/env";
import { mapCourierStatus } from "@/server/courier";
import { productQualityWarnings } from "@/server/content-quality";
import { trackEvent } from "@/lib/analytics";

const base = {
  APP_ENV: "staging" as const,
  AUTH_SECRET: "a-secure-staging-secret",
  DATABASE_URL: "postgresql://db/staging",
  NEXT_PUBLIC_SITE_URL: "https://staging.khelaghor.example",
  STORAGE_DRIVER: "cloudinary" as const,
  CLOUDINARY_CLOUD_NAME: "stage",
  CLOUDINARY_API_KEY: "key",
  CLOUDINARY_API_SECRET: "secret",
  SSLCOMMERZ_MODE: "sandbox" as const,
  SSLCOMMERZ_STORE_ID: "store",
  SSLCOMMERZ_STORE_PASSWORD: "password",
  COURIER_PROVIDER: "mock" as const,
  EMAIL_PROVIDER: "resend" as const,
  EMAIL_FROM: "KhelaGhor <stage@verified.test>",
  RESEND_API_KEY: "resend",
};

describe("staging readiness controls", () => {
  it("accepts isolated staging configuration and rejects localhost/local storage", () => {
    expect(envSchema.safeParse(base).success).toBe(true);
    expect(
      envSchema.safeParse({
        ...base,
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        STORAGE_DRIVER: "local",
      }).success,
    ).toBe(false);
  });
  it("requires credentials for selected provider modes", () => {
    expect(
      envSchema.safeParse({ ...base, SSLCOMMERZ_STORE_PASSWORD: undefined })
        .success,
    ).toBe(false);
    expect(
      envSchema.safeParse({
        ...base,
        COURIER_PROVIDER: "steadfast",
        COURIER_API_KEY: undefined,
        COURIER_API_SECRET: undefined,
      }).success,
    ).toBe(false);
  });
  it("keeps unknown and returned courier states from changing orders", () => {
    expect(mapCourierStatus("unknown")).toBeNull();
    expect(mapCourierStatus("returned_to_origin")).toBeNull();
    expect(mapCourierStatus("failed")).toBeNull();
  });
  it("detects incomplete product content", () => {
    const warnings = productQualityWarnings({
      id: "p",
      name: "Toy",
      nameBn: null,
      sku: "T1",
      shortDescription: "short",
      fullDescription: "short",
      safetyInfo: null,
      ageGroup: null,
      material: null,
      deliveryClass: null,
      seoTitle: null,
      seoDescription: null,
      brandId: null,
      regularPrice: 0,
      salePrice: null,
      stock: 0,
      images: [],
      categories: [],
      variants: [],
    });
    expect(warnings).toContain("Bangla name");
    expect(warnings).toContain("image");
    expect(warnings).toContain("SEO title");
  });
  it("deduplicates purchase analytics by order ID", () => {
    const spy = vi.spyOn(window, "dispatchEvent");
    trackEvent("purchase", { orderId: "ORDER-DEDUPE-1" });
    trackEvent("purchase", { orderId: "ORDER-DEDUPE-1" });
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
