import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "staging-smoke.spec.ts",
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: "https://khelaghor-staging.vercel.app",
    trace: "off",
    video: "off",
    screenshot: "off",
    ...devices["Desktop Chrome"],
  },
  reporter: [["line"]],
});
