import { MarketplaceHome } from "@/components/marketplace-home";
import { prisma } from "@/server/db";
import { productInclude, productToCard } from "@/server/catalog";
import {
  getHomepageSettings,
  type ProductSectionSettings,
} from "@/server/site-settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    homepage,
    products,
    categories,
    brands,
    banners,
    blogPosts,
    reviews,
    sales,
  ] = await Promise.all([
    getHomepageSettings(),
    prisma.product.findMany({
      where: { status: "PUBLISHED", archivedAt: null, active: true },
      include: productInclude,
      orderBy: { updatedAt: "desc" },
      take: 64,
    }),
    prisma.category.findMany({
      where: { archivedAt: null, parentId: null },
      include: {
        children: {
          where: { archivedAt: null },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
        _count: { select: { products: true } },
      },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      take: 16,
    }),
    prisma.brand.findMany({
      where: {},
      include: { _count: { select: { products: true } } },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take: 12,
    }),
    prisma.banner.findMany({
      where: { active: true, placement: "home" },
      orderBy: [{ sortOrder: "asc" }],
      take: 6,
    }),
    prisma.blogPost.findMany({
      where: { draft: false },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        readingTime: true,
        featuredImage: true,
      },
    }),
    prisma.review.findMany({
      where: { status: "APPROVED" },
      include: {
        product: { select: { name: true, slug: true } },
        user: { select: { name: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          status: {
            in: [
              "CONFIRMED",
              "PAYMENT_CONFIRMED",
              "PROCESSING",
              "PACKED",
              "SHIPPED",
              "OUT_FOR_DELIVERY",
              "DELIVERED",
            ],
          },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 16,
    }),
  ]);

  const cards = products.map(productToCard);
  const salesMap = new Map(
    sales.map((item) => [item.productId, item._sum.quantity ?? 0]),
  );
  const automaticFlashSaleProducts = cards.filter(
    (product) =>
      product.salePrice || product.badges.includes("Sale") || product.badges.includes("Flash Sale"),
  );
  const automaticTrendingProducts = cards.filter((product) =>
    product.badges.includes("Featured"),
  ).length
    ? cards.filter((product) => product.badges.includes("Featured"))
    : cards;
  const automaticBestSellers = [...cards].sort((a, b) => {
    const soldDelta = (salesMap.get(b.id) ?? 0) - (salesMap.get(a.id) ?? 0);
    if (soldDelta !== 0) return soldDelta;
    const flagDelta =
      Number(b.badges.includes("Best")) - Number(a.badges.includes("Best"));
    if (flagDelta !== 0) return flagDelta;
    return b.reviews - a.reviews;
  });
  const automaticNewArrivals = [...cards].sort((a, b) => {
    const flagDelta =
      Number(b.badges.includes("New")) - Number(a.badges.includes("New"));
    if (flagDelta !== 0) return flagDelta;
    return a.name.localeCompare(b.name);
  });
  const automaticRecommended = [...cards].sort((a, b) => {
    const categoryDelta = a.categoryName.localeCompare(b.categoryName);
    if (categoryDelta !== 0) return categoryDelta;
    return b.rating - a.rating;
  });
  const flashSaleProducts =
    homepage.flashSaleConfig.hideWhenExpired &&
    homepage.flashSaleConfig.endDate &&
    new Date(homepage.flashSaleConfig.endDate) < new Date()
      ? []
      : applyProductConfig(
          automaticFlashSaleProducts,
          homepage.flashSaleConfig,
          categories,
          products,
        );
  const trendingProducts = applyProductConfig(
    automaticTrendingProducts,
    homepage.trendingConfig,
    categories,
    products,
  );
  const bestSellers = applyProductConfig(
    automaticBestSellers,
    homepage.bestSellerConfig,
    categories,
    products,
  );
  const newArrivals = applyProductConfig(
    automaticNewArrivals,
    homepage.newArrivalConfig,
    categories,
    products,
  );
  const recommended = applyProductConfig(
    automaticRecommended,
    homepage.recommendedConfig,
    categories,
    products,
  );

  return (
    <MarketplaceHome
      homepage={homepage}
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        image: category.image,
        description: category.description,
        productCount: category._count.products,
        children: category.children.map((child) => ({
          name: child.name,
          slug: child.slug,
        })),
      }))}
      products={cards}
      flashSaleProducts={flashSaleProducts}
      trendingProducts={trendingProducts}
      bestSellers={bestSellers}
      newArrivals={newArrivals}
      recommended={recommended}
      banners={banners}
      brands={brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        productCount: brand._count.products,
      }))}
      reviews={reviews}
      blogPosts={blogPosts}
    />
  );
}

function applyProductConfig(
  automaticProducts: ReturnType<typeof productToCard>[],
  config: ProductSectionSettings,
  categories: { id: string; slug: string }[],
  rawProducts: {
    id: string;
    brandId: string | null;
    categories: { categoryId: string }[];
  }[],
) {
  const byId = new Map(automaticProducts.map((product) => [product.id, product]));
  const manual =
    config.mode === "manual"
      ? config.productIds
          .map((id) => byId.get(id))
          .filter(Boolean) as ReturnType<typeof productToCard>[]
      : [];
  const base = manual.length ? manual : automaticProducts;
  const categorySlugSet = new Set(
    categories
      .filter((category) => config.categoryIds.includes(category.id))
      .map((category) => category.slug),
  );
  const productMeta = new Map(
    rawProducts.map((product) => [
      product.id,
      {
        brandId: product.brandId,
        categoryIds: product.categories.map((item) => item.categoryId),
      },
    ]),
  );
  return base.filter((product) => {
    const meta = productMeta.get(product.id);
    if (config.categoryIds.length) {
      const matchesCategory =
        categorySlugSet.has(product.category) ||
        meta?.categoryIds.some((categoryId) => config.categoryIds.includes(categoryId));
      if (!matchesCategory) return false;
    }
    if (config.brandIds.length && !config.brandIds.includes(meta?.brandId ?? "")) {
      return false;
    }
    return true;
  });
}
