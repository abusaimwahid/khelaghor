import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),
  phone: z.string().min(8),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(12),
    confirmPassword: z.string().min(12),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  sku: z.string().min(2),
  brandId: z.string().optional().or(z.literal("")),
  categoryId: z.string().min(1),
  shortDescription: z.string().min(8),
  fullDescription: z.string().min(8),
  regularPrice: z.coerce.number().positive(),
  salePrice: z.coerce.number().nonnegative().optional().or(z.literal("")),
  stock: z.coerce.number().int().min(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  variantSku: z.string().optional(),
  variantSize: z.string().optional(),
  variantColour: z.string().optional(),
  variantStock: z.coerce.number().int().min(0).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  parentId: z.string().optional().or(z.literal("")),
  featured: z.coerce.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export const brandSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  logo: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  featured: z.coerce.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export const cartUpdateSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(0).max(99),
});

export const checkoutSchema = z.object({
  idempotencyKey: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  division: z.string().min(2),
  district: z.string().min(2),
  area: z.string().min(2),
  postalCode: z.string().optional(),
  address: z.string().min(8),
  landmark: z.string().optional(),
  deliveryMethod: z.enum(["STANDARD", "EXPRESS", "SAME_DAY", "PICKUP"]),
  paymentMethod: z.enum([
    "COD",
    "SSLCOMMERZ",
    "BKASH",
    "NAGAD",
    "ROCKET",
    "CARD",
  ]),
  couponCode: z.string().optional(),
});

export const supportSchema = z.object({
  category: z.string().min(2),
  subject: z.string().min(4),
  body: z.string().min(8),
});

export const returnSchema = z.object({
  orderItemId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  reason: z.string().min(3),
  description: z.string().optional(),
});
