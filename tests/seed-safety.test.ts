import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolveSeedPolicy } from "../prisma/seed-policy";

describe("Prisma seed safety", () => {
  it("preserves the local development seed admin", () => {
    expect(resolveSeedPolicy({ NODE_ENV: "development" })).toEqual({
      environment: "development",
      seedDevelopmentAdmin: true,
      seedOperationalAccess: true,
      seedSiteSettings: true,
      seedDevelopmentEmail: true,
    });
  });

  it("keeps staging synthetic-only even when NODE_ENV is development", () => {
    expect(
      resolveSeedPolicy({
        APP_ENV: "staging",
        NODE_ENV: "development",
        CREATE_SEED_ADMIN: "true",
      }),
    ).toEqual({
      environment: "staging",
      seedDevelopmentAdmin: false,
      seedOperationalAccess: false,
      seedSiteSettings: false,
      seedDevelopmentEmail: false,
    });
    const seed = readFileSync("prisma/seed.ts", "utf8");
    expect(seed).toContain('policy.environment === "development"');
    expect(seed).toContain('randomBytes(32).toString("base64url")');
    expect(seed).not.toContain("CREATE_SEED_ADMIN");
  });

  it("never enables development credentials in production", () => {
    expect(
      resolveSeedPolicy({
        APP_ENV: "production",
        NODE_ENV: "development",
        CREATE_SEED_ADMIN: "true",
      }).seedDevelopmentAdmin,
    ).toBe(false);
    expect(
      resolveSeedPolicy({
        NODE_ENV: "production",
        CREATE_SEED_ADMIN: "true",
      }).seedDevelopmentAdmin,
    ).toBe(false);
  });
});
