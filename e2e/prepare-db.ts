import { execFileSync } from "node:child_process";
import { resetAndBootstrapTestDatabase } from "../tests/cleanup";
import { configureTestDatabase } from "../tests/setup-db";

configureTestDatabase("playwright");

async function main() {
  await resetAndBootstrapTestDatabase();
  execFileSync("npx", ["tsx", "prisma/seed.ts"], {
    env: { ...process.env, APP_ENV: "development" },
    stdio: "ignore",
  });
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Test database preparation failed.",
  );
  process.exitCode = 1;
});
