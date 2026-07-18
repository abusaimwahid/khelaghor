import path from "node:path";
import { defineConfig } from "vitest/config";
import { configureTestDatabase } from "./tests/setup-db";

configureTestDatabase("vitest");

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    fileParallelism: false,
    globalSetup: ["tests/vitest-global-setup.ts"],
    include: ["tests/**/*.test.ts"],
  },
});
