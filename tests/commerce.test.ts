import { describe, expect, it } from "vitest";
import { canTransitionOrder, cartSubtotal, discountAmount, hasPermission, orderTotal } from "@/lib/commerce";

describe("commerce calculations", () => {
  it("calculates cart totals in BDT", () => {
    const result = orderTotal([{ price: 1000, salePrice: 800, quantity: 2 }]);
    expect(result.subtotal).toBe(1600);
    expect(result.delivery).toBe(80);
    expect(result.total).toBe(1680);
  });

  it("applies capped percentage coupons", () => {
    expect(discountAmount(10000, { code: "WELCOME10", type: "PERCENT", value: 10, maximumDiscount: 500 })).toBe(500);
  });

  it("validates order status transitions", () => {
    expect(canTransitionOrder("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransitionOrder("DELIVERED", "PROCESSING")).toBe(false);
  });

  it("checks permissions", () => {
    expect(hasPermission(["products.view"], "products.view")).toBe(true);
    expect(hasPermission(["*"], "settings.update")).toBe(true);
  });

  it("calculates raw subtotal", () => {
    expect(cartSubtotal([{ price: 250, quantity: 4 }])).toBe(1000);
  });
});
