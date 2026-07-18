import { expect, test } from "@playwright/test";

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
  await expect(
    page.getByRole("heading", { name: /^checkout$/i }),
  ).toBeVisible();
  await page.getByLabel(/full name/i).fill("Guest Parent");
  await page.getByLabel(/phone number/i).fill("01700000000");
  await page.getByLabel(/email/i).fill("guest@example.com");
  await page.getByRole("combobox", { name: "Division" }).selectOption("dhaka");
  await page
    .getByRole("combobox", { name: "District" })
    .selectOption("dhaka-dhaka");
  await page
    .getByRole("combobox", { name: "Area / Thana" })
    .selectOption("dhaka-dhanmondi");
  const quoteButton = page.getByRole("button", { name: /calculate delivery/i });
  if (await quoteButton.isVisible()) await quoteButton.click();
  await expect(page.getByRole("status")).toContainText("Delivery fee: ৳ 60");
  await page
    .getByRole("combobox", { name: "Division" })
    .selectOption("chattogram");
  await page
    .getByRole("combobox", { name: "District" })
    .selectOption("chattogram-chattogram");
  await page
    .getByRole("combobox", { name: "Area / Thana" })
    .selectOption("chattogram-agrabad");
  await expect(page.getByRole("status")).toContainText("Delivery fee: ৳ 130");
  await page.getByRole("combobox", { name: "Division" }).selectOption("dhaka");
  await page
    .getByRole("combobox", { name: "District" })
    .selectOption("dhaka-dhaka");
  await page
    .getByRole("combobox", { name: "Area / Thana" })
    .selectOption("dhaka-dhanmondi");
  await expect(page.getByRole("status")).toContainText("Delivery fee: ৳ 60");
  await page.getByPlaceholder("WELCOME10").fill("EXPIRED10");
  await page.getByRole("button", { name: /apply/i }).click();
  await expect(page.getByText(/coupon has expired/i)).toBeVisible();
  await page.getByRole("button", { name: /remove/i }).click();
  await page.getByPlaceholder("WELCOME10").fill("FREEDELIVERY");
  await page.getByRole("button", { name: /apply/i }).click();
  await expect(page.getByText(/coupon applied/i)).toBeVisible();
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
  await page.getByLabel(/^password/i).fill("StrongLaunch123!");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(
    page.getByRole("heading", { name: /parent user/i }),
  ).toBeVisible();
});

test("admin logs in and views protected dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@khelaghor.local");
  await page.locator('input[name="password"]').fill("ChangeMe123!");
  await page.getByRole("button", { name: /^login$/i }).click();
  await expect(
    page.getByRole("heading", { name: /operations dashboard/i }),
  ).toBeVisible();
});
