import { defineConfig, devices } from "@playwright/test";
import { configureTestDatabase } from "./tests/setup-db";

configureTestDatabase("playwright");

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  workers: 1,
  webServer: {
    command: "npx tsx e2e/prepare-db.ts && npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
