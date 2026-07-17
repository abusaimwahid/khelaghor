import { Prisma } from "@prisma/client";
import { prisma } from "./db";

export const productInclude = {
  brand: true,
  categories: { include: { category: true } },
  images: { orderBy: { sortOrder: "asc" } },
  variants: true,
  inventory: true,
  reviews: {
    where: { status: "APPROVED", deletedAt: null, hiddenAt: null },
    include: {
      user: true,
      images: true,
      replies: { where: { public: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.ProductInclude;

export type DbProduct = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

export function productToCard(product: DbProduct) {
  const salePrice = product.salePrice ? Number(product.salePrice) : null;
  const price = Number(product.regularPrice);
  const availableStock = Math.max(
    0,
    (product.inventory?.available ?? product.stock) - product.reservedStock,
  );
  const rating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        product.reviews.length
      : 0;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    brand: product.brand?.name ?? "KhelaGhor",
    category: product.categories[0]?.category.slug ?? "shop",
    categoryName: product.categories[0]?.category.name ?? "Shop",
    price,
    salePrice,
    rating,
    reviews: product.reviews.length,
    stock: availableStock,
    image:
      product.images[0]?.url ??
      "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=900&q=80",
    secondImage: product.images[1]?.url ?? null,
    badges: [
      product.featured ? "Featured" : null,
      product.flashSale || salePrice ? "Sale" : null,
      availableStock === 0
        ? "Out of Stock"
        : availableStock <= product.lowStockThreshold
          ? "Limited Stock"
          : null,
      product.newArrival ||
      product.createdAt > new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
        ? "New"
        : null,
      product.bestSeller ? "Best" : null,
      product.preOrder ? "Pre-order" : null,
    ].filter(Boolean) as string[],
    age: product.ageGroup ?? "Unisex",
    gender: product.gender ?? "Unisex",
    description: product.shortDescription,
    variantCount: product.variants.length,
  };
}

export async function listProducts(
  filters: {
    q?: string;
    categorySlug?: string;
    brandSlug?: string;
    status?: "PUBLISHED" | "DRAFT" | "ARCHIVED";
    take?: number;
  } = {},
) {
  const products = await prisma.product.findMany({
    where: {
      archivedAt: null,
      status: filters.status ?? "PUBLISHED",
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: "insensitive" } },
              { sku: { contains: filters.q, mode: "insensitive" } },
              { searchKeywords: { contains: filters.q, mode: "insensitive" } },
              { brand: { name: { contains: filters.q, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(filters.categorySlug
        ? { categories: { some: { category: { slug: filters.categorySlug } } } }
        : {}),
      ...(filters.brandSlug ? { brand: { slug: filters.brandSlug } } : {}),
    },
    include: productInclude,
    orderBy: { createdAt: "desc" },
    take: filters.take,
  });
  return products;
}

export async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, archivedAt: null },
    include: productInclude,
  });
}

export async function listCategories() {
  return prisma.category.findMany({
    where: { archivedAt: null, parentId: null },
    include: {
      children: { where: { archivedAt: null }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listBrands() {
  return prisma.brand.findMany({
    orderBy: [{ featured: "desc" }, { name: "asc" }],
  });
}
