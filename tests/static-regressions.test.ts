import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AppError, toSafeMessage } from "@/server/errors";

describe("static regressions", () => {
  it("does not expose infrastructure errors to checkout users", () => {
    expect(toSafeMessage(new Error("Prisma stack /Users/local path"))).toBe(
      "We could not place your order. Please try again.",
    );
    expect(toSafeMessage(new AppError("Cart is empty.", "CART_EMPTY"))).toBe(
      "Your cart is empty.",
    );
  });

  it("fill images include sizes on product image surfaces", () => {
    const productCard = readFileSync("src/components/product-card.tsx", "utf8");
    const productPage = readFileSync(
      "src/app/products/[slug]/page.tsx",
      "utf8",
    );
    expect(productCard).toContain("sizes=");
    expect(
      productPage.match(/<Image[\s\S]*?fill[\s\S]*?sizes=/g)?.length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("keeps production UI and deployment scaffolding in place", () => {
    const header = readFileSync("src/components/header.tsx", "utf8");
    const states = readFileSync("src/components/states.tsx", "utf8");
    const packageJson = readFileSync("package.json", "utf8");
    const envExample = readFileSync(".env.example", "utf8");
    const migration = readFileSync(
      "prisma/migrations/20260713150000_initial_baseline/migration.sql",
      "utf8",
    );

    expect(header).not.toContain(">2</span>");
    expect(header).not.toContain(">3</span>");
    expect(states).toContain("EmptyState");
    expect(packageJson).toContain("db:migrate:deploy");
    expect(envExample).toContain("SSLCOMMERZ_STORE_ID");
    expect(envExample).toContain("SENTRY_DSN");
    expect(migration).toContain('CREATE TABLE "Product"');
    expect(migration).toContain('CREATE TABLE "Order"');
  });

  it("keeps production integration scaffolding in place", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    const packageJson = readFileSync("package.json", "utf8");
    const storage = readFileSync("src/server/storage.ts", "utf8");
    const sslcommerz = readFileSync(
      "src/server/payments/sslcommerz.ts",
      "utf8",
    );
    const courier = readFileSync("src/server/courier/index.ts", "utf8");
    const email = readFileSync("src/server/notifications/email.ts", "utf8");
    const deploymentChecklist = readFileSync("DEPLOYMENT_CHECKLIST.md", "utf8");
    const liveTestPlan = readFileSync("LIVE_TEST_PLAN.md", "utf8");
    const migration = readFileSync(
      "prisma/migrations/20260713162000_production_deployment_fields/migration.sql",
      "utf8",
    );

    expect(schema).toContain('directUrl = env("DIRECT_URL")');
    expect(schema).toContain("forcePasswordChange");
    expect(packageJson).toContain("admin:create");
    expect(storage).toContain("CloudinaryStorageProvider");
    expect(sslcommerz).toContain("handleSslCommerzCallback");
    expect(sslcommerz).toContain("validationserverAPI.php");
    expect(courier).toContain("createShipment");
    expect(email).toContain("RESEND_API_KEY");
    expect(deploymentChecklist).toContain(
      "Production PostgreSQL database created",
    );
    expect(liveTestPlan.toLowerCase()).toContain(
      "duplicate sslcommerz callback",
    );
    expect(migration).toContain('"courierOrderId"');
  });

  it("keeps launch security controls in place", () => {
    const security = readFileSync("src/server/security.ts", "utf8");
    const auth = readFileSync("src/app/actions/auth.ts", "utf8");
    const storage = readFileSync("src/server/storage.ts", "utf8");
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    expect(security).toContain("httpOnly: true");
    expect(security).toContain('sameSite: "lax"');
    expect(security).toContain('process.env.NODE_ENV === "production"');
    expect(auth).toContain("prisma.session.deleteMany");
    expect(auth).toContain('action: "login.failed"');
    expect(storage).toContain("Local file storage is disabled in production");
    expect(storage).toContain("Invalid protected file key");
    expect(schema).toContain("@@index([paymentStatus, createdAt])");
    expect(schema).toContain("@@index([entity, entityId, createdAt])");
  });
});
