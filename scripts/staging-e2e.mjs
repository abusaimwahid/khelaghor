import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const operatorFile = resolve(root, ".env.staging.operator");
if (existsSync(operatorFile) && process.env.STAGING_OPERATOR_RELOADED !== "1") {
  const result = spawnSync(process.execPath, ["--env-file=.env.staging.operator", ...process.argv.slice(1)], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, STAGING_OPERATOR_RELOADED: "1" },
  });
  process.exit(result.status ?? 1);
}

if (process.env.STAGING_OPERATOR_RELOADED !== "1") {
  const required = [
    "STAGING_TEST_ADMIN_EMAIL",
    "STAGING_TEST_ADMIN_PASSWORD",
    "STAGING_TEST_CUSTOMER_EMAIL",
    "STAGING_TEST_CUSTOMER_PASSWORD",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error("Staging E2E refused: operator credentials are missing.");
    process.exit(2);
  }
}

const baseURL = process.env.STAGING_BASE_URL ?? "https://khelaghor-staging.vercel.app";
if (baseURL !== "https://khelaghor-staging.vercel.app") {
  console.error("Staging E2E refused: STAGING_BASE_URL must be the protected staging origin.");
  process.exit(2);
}
if (/localhost|127\.0\.0\.1|production/i.test(baseURL)) {
  console.error("Staging E2E refused: unsafe target origin.");
  process.exit(2);
}
const mutations = process.env.STAGING_ALLOW_MUTATIONS === "true";
const rotation = process.env.STAGING_ALLOW_PASSWORD_ROTATION === "true";
if (mutations !== rotation) {
  console.error("Staging E2E refused: mutation and password-rotation opt-ins must be enabled together.");
  process.exit(2);
}

const result = spawnSync("npx", ["playwright", "test", "--config=e2e/staging-playwright.config.ts"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, STAGING_BASE_URL: baseURL },
});
process.exit(result.status ?? 1);
