import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runner = readFileSync("scripts/staging-e2e.mjs", "utf8");
const config = readFileSync("e2e/staging-playwright.config.ts", "utf8");

describe("staging operator safety", () => {
  it("requires every operator credential and fixed staging origin", () => {
    expect(runner).toContain("STAGING_TEST_ADMIN_EMAIL");
    expect(runner).toContain("STAGING_TEST_ADMIN_PASSWORD");
    expect(runner).toContain("STAGING_TEST_CUSTOMER_EMAIL");
    expect(runner).toContain("STAGING_TEST_CUSTOMER_PASSWORD");
    expect(runner).toContain("https://khelaghor-staging.vercel.app");
    expect(runner).toContain("localhost|127\\.0\\.0\\.1|production");
  });

  it("requires paired mutation opt-ins", () => {
    expect(runner).toContain("STAGING_ALLOW_MUTATIONS");
    expect(runner).toContain("STAGING_ALLOW_PASSWORD_ROTATION");
    expect(runner).toContain("must be enabled together");
  });

  it("disables evidence capture and local web server", () => {
    expect(config).toContain('screenshot: "off"');
    expect(config).toContain('video: "off"');
    expect(config).toContain('trace: "off"');
    expect(config).not.toContain("webServer");
  });
});
