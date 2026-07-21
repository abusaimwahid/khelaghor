import { expect, test } from "@playwright/test";

test.describe("authorized staging read-only smoke", () => {
  test("admin and customer login pages are reachable", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("body")).toContainText(/sign in|login/i);
  });

  test("public storefront surfaces load", async ({ page }) => {
    for (const path of ["/", "/shop", "/categories"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
    }
  });
});
