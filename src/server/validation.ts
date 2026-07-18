import { z } from "zod";
import { strongPasswordSchema } from "./password-policy";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),
  phone: z.string().min(8),
  password: strongPasswordSchema,
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
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(12),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().nonnegative().optional(),
);

const optionalInt = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().nonnegative().optional(),
);

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional(),
);

const checkboxBoolean = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.boolean(),
);

export const productSchema = z
  .object({
    name: z.string().min(2),
    nameBn: z.string().optional(),
    slug: z
      .string()
      .min(2)
      .regex(/^[a-z0-9-]+$/),
    sku: z.string().min(2),
    barcode: z.string().optional(),
    brandId: z.string().optional().or(z.literal("")),
    categoryIds: z.array(z.string()).min(1).optional(),
    categoryId: z.string().optional(),
    tags: z.string().optional(),
    productType: z.string().optional(),
    gender: z.string().optional(),
    ageGroup: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    shortDescription: z.string().min(8),
    shortDescriptionBn: z.string().optional(),
    fullDescription: z.string().min(8),
    fullDescriptionBn: z.string().optional(),
    safetyInfo: z.string().optional(),
    careInstructions: z.string().optional(),
    warranty: z.string().optional(),
    returnEligible: checkboxBoolean.optional(),
    specifications: z.string().optional(),
    costPrice: optionalNumber,
    regularPrice: z.coerce.number().positive(),
    salePrice: optionalNumber,
    saleStartsAt: optionalDate,
    saleEndsAt: optionalDate,
    taxable: checkboxBoolean.optional(),
    tax: optionalNumber,
    trackStock: checkboxBoolean.optional(),
    stock: z.coerce.number().int().min(0),
    reservedStock: z.coerce.number().int().min(0).default(0),
    lowStockThreshold: z.coerce.number().int().min(0).default(5),
    minQuantity: z.coerce.number().int().min(1).default(1),
    maxQuantity: optionalInt,
    allowBackorder: checkboxBoolean.optional(),
    stockStatus: z.string().optional(),
    weight: optionalNumber,
    length: optionalNumber,
    width: optionalNumber,
    height: optionalNumber,
    deliveryClass: z.string().optional(),
    featured: checkboxBoolean.optional(),
    newArrival: checkboxBoolean.optional(),
    bestSeller: checkboxBoolean.optional(),
    flashSale: checkboxBoolean.optional(),
    preOrder: checkboxBoolean.optional(),
    active: checkboxBoolean.optional(),
    published: checkboxBoolean.optional(),
    publishedAt: optionalDate,
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    searchKeywords: z.string().optional(),
    canonicalUrl: z.string().optional(),
    socialImage: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    variantSku: z.string().optional(),
    variantSize: z.string().optional(),
    variantColour: z.string().optional(),
    variantStock: z.coerce.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.salePrice !== undefined && data.salePrice > data.regularPrice) {
      ctx.addIssue({
        code: "custom",
        path: ["salePrice"],
        message: "Sale price cannot exceed regular price.",
      });
    }
    if (
      data.saleStartsAt &&
      data.saleEndsAt &&
      data.saleEndsAt < data.saleStartsAt
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["saleEndsAt"],
        message: "Sale end cannot be before sale start.",
      });
    }
    if (data.maxQuantity && data.maxQuantity < data.minQuantity) {
      ctx.addIssue({
        code: "custom",
        path: ["maxQuantity"],
        message: "Maximum order quantity cannot be below minimum.",
      });
    }
  });

export const categorySchema = z.object({
  name: z.string().min(2),
  nameBn: z.string().optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  parentId: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
  descriptionBn: z.string().optional(),
  image: z.string().optional().or(z.literal("")),
  icon: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  active: checkboxBoolean.optional(),
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
  description: z.string().optional(),
  descriptionBn: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  country: z.string().optional(),
  active: checkboxBoolean.optional(),
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
  divisionId: z.string().min(2),
  districtId: z.string().min(2),
  areaId: z.string().min(2),
  postalCode: z.string().optional(),
  address: z.string().min(8),
  landmark: z.string().optional(),
  deliveryMethod: z
    .enum(["standard", "express", "pickup", "STANDARD", "EXPRESS", "PICKUP"])
    .transform(
      (value) => value.toLowerCase() as "standard" | "express" | "pickup",
    ),
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
  priority: z.string().optional(),
  body: z.string().min(8),
  attachmentUrls: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) =>
      Array.isArray(value)
        ? value.filter(Boolean)
        : value
          ? [value].filter(Boolean)
          : [],
    ),
});

export const returnSchema = z.object({
  orderItemId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  reason: z.string().min(3),
  description: z.string().optional(),
  resolution: z.string().optional(),
  evidenceUrls: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) =>
      Array.isArray(value)
        ? value.filter(Boolean)
        : value
          ? [value].filter(Boolean)
          : [],
    ),
});
