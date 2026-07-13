import { describe, expect, it } from "vitest";
import { checkoutSchema, productSchema, registerSchema } from "@/server/validation";

describe("server validation", () => {
  it("requires strong registration data", () => {
    expect(registerSchema.safeParse({ name: "A", email: "bad", phone: "1", password: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Nusrat", email: "NUSRAT@EXAMPLE.COM", phone: "01700000000", password: "Strong123" }).success).toBe(true);
  });

  it("prevents negative product stock and invalid slugs", () => {
    const result = productSchema.safeParse({
      name: "Blocks",
      slug: "Bad Slug",
      sku: "KG-1",
      categoryId: "cat",
      shortDescription: "Safe blocks",
      fullDescription: "Safe wooden blocks",
      regularPrice: 100,
      stock: -1,
      status: "PUBLISHED",
    });
    expect(result.success).toBe(false);
  });

  it("requires checkout idempotency and valid payment methods", () => {
    const result = checkoutSchema.safeParse({
      idempotencyKey: "abcdefgh",
      fullName: "Nusrat Jahan",
      phone: "01700000000",
      email: "nusrat@example.com",
      division: "Dhaka",
      district: "Dhaka",
      area: "Dhanmondi",
      address: "House 1, Road 2",
      deliveryMethod: "STANDARD",
      paymentMethod: "COD",
    });
    expect(result.success).toBe(true);
  });
});
