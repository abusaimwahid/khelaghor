import { describe, expect, it } from "vitest";
import { formatDate, formatMoney, localizedPath, localize, messages } from "@/lib/i18n";

describe("localisation", () => {
  it("keeps English at the root and prefixes Bangla links", () => {
    expect(localizedPath("/shop", "en")).toBe("/shop");
    expect(localizedPath("/shop", "bn")).toBe("/bn/shop");
    expect(localizedPath("/bn/cart", "en")).toBe("/cart");
  });

  it("falls back to required English business content", () => {
    expect(localize("Wooden blocks", null, "bn")).toBe("Wooden blocks");
    expect(localize("Wooden blocks", "কাঠের ব্লক", "bn")).toBe("কাঠের ব্লক");
  });

  it("loads structured Bangla messages and Bangladesh formatting", () => {
    expect(messages("bn").global.cart).toBe("কার্ট");
    expect(formatMoney(1250, "en")).toContain("1,250");
    expect(formatMoney(1250, "bn")).toMatch(/[১২৫০]/);
    expect(formatDate("2026-07-17T00:00:00Z", "bn")).toBeTruthy();
  });
});
