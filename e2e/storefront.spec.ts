import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";

test.beforeAll(() => {
  execFileSync("npm", ["run", "db:seed"], { stdio: "inherit" });
});

test("customer browses a category and opens a database product", async ({
  page,
}) => {
  await page.goto("/categories/toys");
  await expect(page.getByRole("heading", { name: /toys/i })).toBeVisible();
  await page.locator('a[href^="/products/"]').first().click();
  await expect(
    page.getByRole("button", { name: /add to cart/i }),
  ).toBeVisible();
});

test("guest adds product to cart and completes COD checkout", async ({
  page,
}) => {
  await page.goto("/shop");
  await page.locator('button:has-text("Add"):not([disabled])').first().click();
  await expect(
    page.getByRole("heading", { name: /shopping cart/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: /checkout/i }).click();
  await page.getByLabel(/full name/i).fill("Guest Parent");
  await page.getByLabel(/phone number/i).fill("01700000000");
  await page.getByLabel(/email/i).fill("guest@example.com");
  await page.getByLabel(/division/i).fill("Dhaka");
  await page.getByLabel(/district/i).fill("Dhaka");
  await page.getByLabel(/area/i).fill("Dhanmondi");
  await page.getByLabel(/full address/i).fill("House 1, Road 2, Dhanmondi");
  await page.getByLabel(/terms and conditions/i).check();
  await page.getByRole("button", { name: /place order/i }).click();
  await expect(page.getByRole("heading", { name: /thank you/i })).toBeVisible();
});

test("customer registers and reaches account dashboard", async ({ page }) => {
  const email = `parent-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel(/full name/i).fill("Parent User");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/phone/i).fill("01711111111");
  await page.getByLabel(/^password/i).fill("Strong123");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(
    page.getByRole("heading", { name: /parent user/i }),
  ).toBeVisible();
});

test("admin logs in and views protected dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@khelaghor.local");
  await page.getByLabel(/password/i).fill("ChangeMe123!");
  await page.getByRole("button", { name: /^login$/i }).click();
  await expect(
    page.getByRole("heading", { name: /operations dashboard/i }),
  ).toBeVisible();
});
