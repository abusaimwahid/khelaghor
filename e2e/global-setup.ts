import { execFileSync } from "node:child_process";
import { resetAndBootstrapTestDatabase } from "../tests/cleanup";

export default async function globalSetup() {
  await resetAndBootstrapTestDatabase();
  execFileSync("npx", ["tsx", "prisma/seed.ts"], {
    env: { ...process.env, APP_ENV: "development" },
    stdio: "ignore",
  });
}
