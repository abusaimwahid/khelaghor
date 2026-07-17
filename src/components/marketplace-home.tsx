import Link from "next/link";
import {
  ArrowRight,
  Baby,
  BookOpen,
  Boxes,
  CheckCircle2,
  Clock3,
  CreditCard,
  Headphones,
  PackageSearch,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { HeroSlider, type HeroSlide } from "./hero-slider";
import { NewsletterSignup } from "./newsletter-signup";
import { ProductCard, type CardProduct } from "./product-card";
import { StatusBadge } from "./status-badge";
import { money } from "@/lib/utils";
import {
  activeHomepageItems,
  type HomeSectionSettings,
  type HomepageSettings,
} from "@/server/site-settings";

type CategoryCard = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  href?: string;
  productCount: number;
  children: { name: string; slug: string }[];
};

type BrandCard = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  productCount: number;
};

type BannerCard = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  href: string | null;
};

type ReviewCard = {
  id: string;
  rating: number;
  text: string;
  verifiedPurchase: boolean;
  product: { name: string; slug: string };
  user: { name: string | null };
};

type BlogCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  readingTime: number;
  featuredImage?: string | null;
};

export function MarketplaceHome({
  homepage,
  categories,
  products,
  flashSaleProducts,
  trendingProducts,
  bestSellers,
  newArrivals,
  recommended,
  banners,
  brands,
  reviews,
  blogPosts,
}: {
  homepage: HomepageSettings;
  categories: CategoryCard[];
  products: CardProduct[];
  flashSaleProducts: CardProduct[];
  trendingProducts: CardProduct[];
  bestSellers: CardProduct[];
  newArrivals: CardProduct[];
  recommended: CardProduct[];
  banners: BannerCard[];
  brands: BrandCard[];
  reviews: ReviewCard[];
  blogPosts: BlogCard[];
}) {
  const heroSlides = buildHeroSlides(homepage, banners, products);
  const promoCards = buildPromoCards(homepage, banners);
  const selectedCategories = selectCategories(
    categories,
    homepage.categorySelections,
    homepage.featuredCategories.maxItems || 12,
  );
  const selectedBrands = selectBrands(
    brands,
    homepage.featuredBrandSelections,
    homepage.featuredBrands.maxItems || 12,
  );
  const deal =
    products.find((product) => product.id === homepage.dealOfDay.productId) ??
    flashSaleProducts[0] ??
    products.find((product) => product.salePrice);
  return (
    <div className="kg-home bg-[var(--background)] pb-4">
      <section className="container grid gap-4 py-5 lg:grid-cols-[1fr_300px]">
        <aside className="hidden rounded-[18px] bg-white p-3 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 px-2 text-sm font-black text-navy">
            <Boxes className="h-4 w-4 text-coral" />
            Category shortcuts
          </h2>
          <div className="grid gap-1">
            {selectByIds(
              categories,
              homepage.navigation.heroShortcutCategoryIds,
              10,
            ).map((category) => (
              <Link
                key={category.id}
                href={category.href || `/categories/${category.slug}`}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-bold text-navy hover:bg-cream"
              >
                {category.name}
                <span className="text-xs text-slate-400">
                  {category.productCount}
                </span>
              </Link>
            ))}
          </div>
        </aside>
        <HeroSlider slides={heroSlides} />
        <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {(promoCards.length ? promoCards : fallbackPromos)
            .slice(0, 2)
            .map((banner) => (
              <PromoTile key={banner.id} banner={banner} />
            ))}
        </aside>
        <div className="scrollbar-none flex gap-3 overflow-x-auto lg:hidden">
          {selectByIds(
            categories,
            homepage.navigation.heroShortcutCategoryIds,
            10,
          ).map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="min-w-28 rounded-lg bg-white p-3 text-center text-sm font-black text-navy shadow-sm"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <Benefits
        section={homepage.trustBadges}
        benefits={homepage.serviceBenefits}
      />
      <CategoryMarketplaceGrid
        section={homepage.featuredCategories}
        categories={selectedCategories}
      />
      <FlashSaleStrip
        section={homepage.flashSale}
        products={flashSaleProducts}
      />
      <PromotionalBanners
        section={homepage.promotionalBanners}
        banners={promoCards}
      />
      <TabbedProducts
        section={homepage.trending}
        products={trendingProducts}
        categories={selectByIds(
          categories,
          homepage.trendingConfig.tabCategoryIds,
          5,
        )}
      />
      <AgeDiscovery
        section={homepage.shopByAge}
        products={products}
        groups={homepage.ageGroups}
      />
      <ProductRail
        section={homepage.bestSellers}
        products={bestSellers}
        eyebrow="Real order data first, manual flag fallback"
      />
      <ProductRail section={homepage.newArrivals} products={newArrivals} />
      <BrandStrip section={homepage.featuredBrands} brands={selectedBrands} />
      {homepage.dealOfDay.enabled && deal ? (
        <DealOfDay product={deal} config={homepage.dealOfDay} />
      ) : null}
      <InterestCollections
        collections={homepage.interestCollections}
        categories={categories}
      />
      <ProductRail
        section={{ ...homepage.trending, title: "Recommended for discovery" }}
        products={recommended}
      />
      <ReviewSection
        section={homepage.testimonials}
        reviews={reviews}
        config={homepage.reviewsConfig}
      />
      <BlogGuides
        section={homepage.blogPreview}
        posts={blogPosts}
        config={homepage.blogConfig}
      />
      <NewsletterPanel
        section={homepage.newsletter}
        config={homepage.newsletterConfig}
      />
    </div>
  );
}

function buildHeroSlides(
  homepage: HomepageSettings,
  banners: BannerCard[],
  products: CardProduct[],
): HeroSlide[] {
  const configured = activeHomepageItems(homepage.heroSlides);
  if (configured.length) {
    return configured.map((slide, index) => ({
      title: slide.title,
      highlightedText: slide.highlightedText,
      subtitle: slide.subtitle,
      description: slide.description,
      image: slide.image || products[index]?.image,
      mobileImage: slide.mobileImage || slide.image || products[index]?.image,
      primaryLabel: slide.primaryButtonLabel || "Shop now",
      primaryHref: slide.primaryButtonLink || "/shop",
      secondaryLabel: slide.secondaryButtonLabel || "Browse categories",
      secondaryHref: slide.secondaryButtonLink || "/categories",
      background:
        slide.backgroundStyle || "linear-gradient(135deg, #10264a, #16a394)",
      alignment: slide.alignment,
      overlayStrength: slide.overlayStrength,
      durationMs: slide.durationMs,
    }));
  }
  const primary: HeroSlide = {
    title: homepage.hero.title,
    highlightedText: homepage.hero.highlightedText,
    subtitle: homepage.hero.subtitle,
    image: homepage.hero.image || products[0]?.image,
    primaryLabel: homepage.hero.primaryButtonLabel || "Shop now",
    primaryHref: homepage.hero.primaryButtonLink || "/shop",
    secondaryLabel: homepage.hero.secondaryButtonLabel || "Browse categories",
    secondaryHref: homepage.hero.secondaryButtonLink || "/categories",
    background: homepage.hero.backgroundStyle?.startsWith("#")
      ? homepage.hero.backgroundStyle
      : "linear-gradient(135deg, #10264a, #16a394)",
  };
  return [
    primary,
    ...banners.slice(0, 3).map((banner, index) => ({
      title: banner.title,
      subtitle:
        banner.subtitle ?? "Curated products for playful, practical families.",
      image: banner.image || products[index + 1]?.image,
      primaryLabel: "Shop collection",
      primaryHref: banner.href || "/shop",
      secondaryLabel: "See offers",
      secondaryHref: "/offers",
      background:
        index % 2
          ? "linear-gradient(135deg, #153963, #ff5c75)"
          : "linear-gradient(135deg, #10264a, #ff9f1c)",
    })),
  ];
}

type PromoTileCard = BannerCard & {
  ctaLabel?: string;
  backgroundColour?: string;
  textColour?: string;
};

function buildPromoCards(
  homepage: HomepageSettings,
  banners: BannerCard[],
): PromoTileCard[] {
  const configured = activeHomepageItems(homepage.sidePromoCards).filter(
    (promo) =>
      promo.placement === "home-upper" || promo.placement === "home-middle",
  );
  if (configured.length) {
    return configured.map((promo) => ({
      id: promo.id,
      title: promo.title,
      subtitle: promo.subtitle,
      image: promo.image || promo.mobileImage || null,
      href: promo.link || "/shop",
      ctaLabel: promo.ctaLabel,
      backgroundColour: promo.backgroundColour,
      textColour: promo.textColour,
    }));
  }
  return banners.slice(0, 3);
}

function PromoTile({ banner }: { banner: PromoTileCard }) {
  return (
    <Link
      href={banner.href || "/shop"}
      className="group relative min-h-[216px] overflow-hidden rounded-[20px] bg-white p-6 shadow-[0_10px_30px_rgba(16,38,74,.07)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]"
      style={{
        backgroundColor: banner.backgroundColour || undefined,
        color: banner.textColour || undefined,
      }}
    >
      <span className="rounded-full bg-sun px-3 py-1 text-xs font-black text-navy">
        Offer
      </span>
      <h2 className="mt-4 max-w-[15rem] text-2xl font-black leading-tight text-navy">
        {banner.title}
      </h2>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-600">
        {banner.subtitle || "Original KhelaGhor picks from your catalog."}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-coral">
        {banner.ctaLabel || "Explore"} <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function Benefits({
  section,
  benefits,
}: {
  section: HomeSectionSettings;
  benefits: HomepageSettings["serviceBenefits"];
}) {
  if (!section.enabled) return null;
  const configured = benefits
    .filter((benefit) => benefit.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, section.maxItems || 6);
  return (
    <section className="container py-2">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {configured.map((benefit) => {
          const Icon = benefitIcon(benefit.icon);
          return (
            <div
              key={benefit.id}
              className="flex min-h-20 items-center gap-3 rounded-[16px] bg-white px-4 py-3 text-sm font-black text-navy shadow-sm transition hover:-translate-y-0.5"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf9f6]">
                <Icon className="h-5 w-5 text-teal" />
              </span>
              <span>{benefit.title}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SectionTitle({
  title,
  subtitle,
  href,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  eyebrow?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="text-xs font-black uppercase text-teal">{eyebrow}</p>
        ) : null}
        <h2 className="text-2xl font-black tracking-[-0.02em] text-navy md:text-3xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {subtitle}
          </p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="hidden items-center gap-1 text-sm font-black text-coral md:inline-flex"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function CategoryMarketplaceGrid({
  section,
  categories,
}: {
  section: HomeSectionSettings;
  categories: CategoryCard[];
}) {
  if (!section.enabled) return null;
  return (
    <section className="container py-10">
      <SectionTitle
        title={section.title}
        subtitle={section.subtitle || "Browse by real catalog categories"}
        href={section.link || "/categories"}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {categories.slice(0, section.maxItems || 12).map((category) => (
          <Link
            key={category.id}
            href={category.href || `/categories/${category.slug}`}
            className="group rounded-[18px] border border-[var(--border)] bg-white p-4 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-coral/20 hover:shadow-[var(--shadow-hover)]"
          >
            <div className="mx-auto grid aspect-square w-full max-w-28 place-items-center overflow-hidden rounded-[16px] bg-gradient-to-br from-[#fff8ec] to-[#eef8f7]">
              {category.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={category.image}
                  alt=""
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <PackageSearch className="h-9 w-9 text-coral" />
              )}
            </div>
            <strong className="mt-3 block line-clamp-2 min-h-10 text-sm text-navy">
              {category.name}
            </strong>
            <span className="text-xs font-bold text-slate-500">
              {category.productCount} products
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FlashSaleStrip({
  section,
  products,
}: {
  section: HomeSectionSettings;
  products: CardProduct[];
}) {
  if (!section.enabled) return null;
  return (
    <section className="container py-8 text-white">
      <div className="rounded-[24px] bg-gradient-to-br from-[#0d2345] to-[#153963] p-5 shadow-[0_18px_45px_rgba(16,38,74,.18)] md:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="rounded-full bg-sun px-3 py-1 text-xs font-black text-navy">
              Ending Soon
            </span>
            <h2 className="mt-2 text-2xl font-black">{section.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 font-black">
              <Clock3 className="h-4 w-4" />
              Local sale window
            </span>
            <Link
              href={section.link || "/flash-sale"}
              className="font-black text-sun"
            >
              View all
            </Link>
          </div>
        </div>
        {products.length ? (
          <div className="scrollbar-none grid auto-cols-[minmax(210px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-2 lg:grid-flow-row lg:grid-cols-5">
            {products.slice(0, section.maxItems || 10).map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/20 p-5 font-bold text-white/70">
            Add sale prices or flash-sale flags to published products to
            populate this section.
          </div>
        )}
      </div>
    </section>
  );
}

function PromotionalBanners({
  section,
  banners,
}: {
  section: HomeSectionSettings;
  banners: PromoTileCard[];
}) {
  if (!section.enabled) return null;
  const items = banners.length ? banners : fallbackPromos;
  return (
    <section className="container grid gap-3 py-8 md:grid-cols-3">
      {items.slice(0, 3).map((banner, index) => (
        <Link
          key={banner.id}
          href={banner.href || "/shop"}
          className={
            index === 1
              ? "rounded-lg bg-teal p-5 text-white shadow-sm"
              : "rounded-lg bg-white p-5 text-navy shadow-sm"
          }
        >
          <span className="rounded-full bg-sun px-3 py-1 text-xs font-black text-navy">
            {["Educational Toys", "Baby Essentials", "Kids Fashion"][index] ??
              "Feature"}
          </span>
          <h2 className="mt-4 text-xl font-black">{banner.title}</h2>
          <p
            className={
              index === 1
                ? "mt-2 text-sm font-semibold text-white/80"
                : "mt-2 text-sm font-semibold text-slate-600"
            }
          >
            {banner.subtitle}
          </p>
          <span
            className={
              index === 1
                ? "mt-4 inline-flex font-black text-white"
                : "mt-4 inline-flex font-black text-coral"
            }
          >
            {banner.ctaLabel || "Shop now"}
          </span>
        </Link>
      ))}
    </section>
  );
}

function TabbedProducts({
  section,
  products,
  categories,
}: {
  section: HomeSectionSettings;
  products: CardProduct[];
  categories: CategoryCard[];
}) {
  if (!section.enabled) return null;
  return (
    <section className="container py-10">
      <SectionTitle
        title={section.title}
        subtitle={section.subtitle || "Fast paths into popular catalog areas"}
        href={section.link || "/shop"}
      />
      <div className="mb-4 flex gap-2 overflow-x-auto">
        <Link
          className="rounded-full bg-navy px-4 py-2 text-sm font-black text-white"
          href="/shop"
        >
          All
        </Link>
        {categories.slice(0, 5).map((category) => (
          <Link
            key={category.id}
            className="rounded-full bg-white px-4 py-2 text-sm font-black text-navy shadow-sm"
            href={`/shop?category=${category.slug}`}
          >
            {category.name}
          </Link>
        ))}
      </div>
      <ProductCards products={products.slice(0, section.maxItems || 10)} />
    </section>
  );
}

function ProductRail({
  section,
  products,
  eyebrow,
}: {
  section: HomeSectionSettings;
  products: CardProduct[];
  eyebrow?: string;
}) {
  if (!section.enabled) return null;
  return (
    <section className="container py-10">
      <SectionTitle
        title={section.title}
        subtitle={section.subtitle}
        href={section.link || "/shop"}
        eyebrow={eyebrow}
      />
      <ProductCards products={products.slice(0, section.maxItems || 10)} />
    </section>
  );
}

function ProductCards({ products }: { products: CardProduct[] }) {
  return products.length ? (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < 5}
          compact
        />
      ))}
    </div>
  ) : (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-6 text-center font-bold text-slate-500">
      No eligible products yet.
    </div>
  );
}

function AgeDiscovery({
  section,
  products,
  groups,
}: {
  section: HomeSectionSettings;
  products: CardProduct[];
  groups: HomepageSettings["ageGroups"];
}) {
  if (!section.enabled) return null;
  const ages = groups
    .filter((group) => group.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, section.maxItems || 7);
  return (
    <section className="container py-8">
      <SectionTitle
        title={section.title}
        subtitle="Age-friendly discovery with real product counts"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {ages.map((group) => {
          const count = products.filter(
            (product) =>
              product.age === group.ageAttribute || product.age === group.label,
          ).length;
          return (
            <Link
              key={group.id}
              href={
                group.link || `/shop?age=${encodeURIComponent(group.label)}`
              }
              className="rounded-lg bg-white p-4 shadow-sm"
            >
              <Baby className="h-7 w-7 text-coral" />
              <h3 className="mt-3 font-black text-navy">{group.label}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {group.description}
              </p>
              <p className="mt-3 text-xs font-black text-teal">
                {count} products
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function BrandStrip({
  section,
  brands,
}: {
  section: HomeSectionSettings;
  brands: BrandCard[];
}) {
  if (!section.enabled) return null;
  return (
    <section className="container py-8">
      <SectionTitle
        title={section.title}
        subtitle="Featured brands with real catalog counts"
        href={section.link || "/brands"}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {brands.slice(0, section.maxItems || 12).map((brand) => (
          <Link
            key={brand.id}
            href={`/brands/${brand.slug}`}
            className="rounded-lg bg-white p-4 text-center shadow-sm"
          >
            <div className="mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-md bg-cream">
              {brand.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logo}
                  alt=""
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <Sparkles className="h-7 w-7 text-teal" />
              )}
            </div>
            <strong className="mt-3 block text-navy">{brand.name}</strong>
            <span className="text-xs font-bold text-slate-500">
              {brand.productCount} products
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DealOfDay({
  product,
  config,
}: {
  product: CardProduct;
  config: HomepageSettings["dealOfDay"];
}) {
  if (config.endDate && new Date(config.endDate) < new Date()) return null;
  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;
  return (
    <section className="container py-8">
      <div
        className="grid gap-5 rounded-lg bg-white p-5 shadow-sm md:grid-cols-[280px_1fr_auto]"
        style={{ background: config.backgroundStyle || undefined }}
      >
        <div className="grid aspect-square place-items-center rounded-lg bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.imageOverride || product.image}
            alt={product.name}
            className="h-full w-full object-contain p-4"
          />
        </div>
        <div className="flex flex-col justify-center">
          <StatusBadge>{config.title || "Deal of the Day"}</StatusBadge>
          <h2 className="mt-3 text-2xl font-black text-navy">{product.name}</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
            {config.description || product.description}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <strong className="text-3xl text-coral">
              {money(product.salePrice ?? product.price)}
            </strong>
            {product.salePrice ? (
              <span className="font-bold text-slate-500 line-through">
                {money(product.price)}
              </span>
            ) : null}
            {discount ? (
              <span className="rounded-full bg-sun px-3 py-1 text-xs font-black text-navy">
                {discount}% off
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm font-bold text-teal">
            {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
          </p>
        </div>
        <div className="flex items-center">
          <Link
            href={`/products/${product.slug}`}
            className="rounded-md bg-coral px-5 py-3 font-black text-white"
          >
            {config.ctaLabel || "View product"}
          </Link>
        </div>
      </div>
    </section>
  );
}

function InterestCollections({
  collections,
  categories,
}: {
  collections: HomepageSettings["interestCollections"];
  categories: CategoryCard[];
}) {
  const items = collections
    .filter((collection) => collection.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (!items.length) return null;
  return (
    <section className="container py-8">
      <SectionTitle
        title="Shop by interest"
        subtitle="Editorial collections mapped to real search and catalog filters"
      />
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => {
          const category = categories.find(
            (category) => category.id === item.categoryId,
          );
          const href =
            item.link || (category ? `/categories/${category.slug}` : "/shop");
          return (
            <Link
              key={item.id}
              href={href}
              className="rounded-lg bg-white p-4 shadow-sm"
            >
              <BookOpen className="h-7 w-7 text-teal" />
              <h3 className="mt-3 font-black text-navy">{item.name}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ReviewSection({
  section,
  reviews,
  config,
}: {
  section: HomeSectionSettings;
  reviews: ReviewCard[];
  config: HomepageSettings["reviewsConfig"];
}) {
  if (!section.enabled) return null;
  const selectedReviews = config.reviewIds.length
    ? (config.reviewIds
        .map((id) => reviews.find((review) => review.id === id))
        .filter(Boolean) as ReviewCard[])
    : reviews.filter((review) => review.rating >= config.minimumRating);
  return (
    <section className="container py-8">
      <SectionTitle
        title={section.title}
        subtitle="Approved product reviews only"
      />
      {selectedReviews.length ? (
        <div className="grid gap-3 md:grid-cols-3">
          {selectedReviews.slice(0, config.maxItems || 3).map((review) => (
            <Link
              key={review.id}
              href={`/products/${review.product.slug}`}
              className="rounded-lg bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-1 text-orange">
                {Array.from({ length: review.rating }).map((_, index) => (
                  <span key={index}>★</span>
                ))}
              </div>
              <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">
                {review.text}
              </p>
              <p className="mt-4 font-black text-navy">
                {review.user.name ?? "KhelaGhor customer"}
              </p>
              <p className="text-xs font-bold text-teal">
                {config.showVerifiedBadge && review.verifiedPurchase
                  ? "Verified purchase"
                  : review.product.name}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-6 font-bold text-slate-500">
          Approved customer reviews will appear here after moderation.
        </div>
      )}
    </section>
  );
}

function BlogGuides({
  section,
  posts,
  config,
}: {
  section: HomeSectionSettings;
  posts: BlogCard[];
  config: HomepageSettings["blogConfig"];
}) {
  if (!section.enabled) return null;
  const selectedPosts = config.postIds.length
    ? (config.postIds
        .map((id) => posts.find((post) => post.id === id))
        .filter(Boolean) as BlogCard[])
    : posts;
  return (
    <section className="container py-8">
      <SectionTitle
        title={section.title}
        subtitle="Buying guides, safety notes and parenting reads"
        href={section.link || "/blog"}
      />
      {selectedPosts.length ? (
        <div className="grid gap-3 md:grid-cols-3">
          {selectedPosts.slice(0, config.maxItems || 3).map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="overflow-hidden rounded-lg bg-white shadow-sm"
            >
              <div className="aspect-[16/9] bg-cream">
                {post.featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.featuredImage}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="p-4">
                {config.showReadingTime ? (
                  <p className="text-xs font-black uppercase text-teal">
                    {post.readingTime} min read
                  </p>
                ) : null}
                <h3 className="mt-2 line-clamp-2 font-black text-navy">
                  {post.title}
                </h3>
                {config.showExcerpt ? (
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-600">
                    {post.excerpt}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-6 font-bold text-slate-500">
          Published blog posts will appear here.
        </div>
      )}
    </section>
  );
}

function NewsletterPanel({
  section,
  config,
}: {
  section: HomeSectionSettings;
  config: HomepageSettings["newsletterConfig"];
}) {
  if (!section.enabled) return null;
  return (
    <section className="container py-8">
      <div className="rounded-lg bg-navy p-6 text-center text-white">
        <h2 className="text-2xl font-black">{section.title}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold text-white/75">
          {section.subtitle ||
            "Get product drops, safety guides and family-friendly offers. No spam."}
        </p>
        <NewsletterSignup />
        <p className="mt-3 text-xs font-bold text-white/60">
          {config.privacyNote}
        </p>
      </div>
    </section>
  );
}

function selectByIds<T extends { id: string }>(
  items: T[],
  ids: string[],
  take: number,
) {
  const selected = ids
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean) as T[];
  const seen = new Set(selected.map((item) => item.id));
  return [...selected, ...items.filter((item) => !seen.has(item.id))].slice(
    0,
    take,
  );
}

function selectCategories(
  categories: CategoryCard[],
  selections: HomepageSettings["categorySelections"],
  take: number,
) {
  const configured = selections
    .filter((selection) => selection.categoryId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((selection) => {
      const category = categories.find(
        (item) => item.id === selection.categoryId,
      );
      if (!category) return null;
      return {
        ...category,
        name: selection.displayTitle || category.name,
        image: selection.imageOverride || category.image,
        href: selection.linkOverride || undefined,
      };
    })
    .filter(Boolean) as CategoryCard[];
  return configured.length
    ? configured.slice(0, take)
    : categories.slice(0, take);
}

function selectBrands(
  brands: BrandCard[],
  selections: HomepageSettings["featuredBrandSelections"],
  take: number,
) {
  const configured = selections
    .filter((selection) => selection.brandId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((selection) => {
      const brand = brands.find((item) => item.id === selection.brandId);
      if (!brand) return null;
      return {
        ...brand,
        name: selection.displayName || brand.name,
        logo: selection.logoOverride || brand.logo,
      };
    })
    .filter(Boolean) as BrandCard[];
  return configured.length ? configured.slice(0, take) : brands.slice(0, take);
}

function benefitIcon(icon: string) {
  if (icon.includes("truck")) return Truck;
  if (icon.includes("return")) return RefreshCcw;
  if (icon.includes("payment") || icon.includes("card")) return CreditCard;
  if (icon.includes("cod") || icon.includes("cash")) return CheckCircle2;
  if (icon.includes("support") || icon.includes("headphone")) return Headphones;
  return ShieldCheck;
}

const fallbackPromos: PromoTileCard[] = [
  {
    id: "educational",
    title: "Learning through play",
    subtitle: "Toys and books that support curious children.",
    image: null,
    href: "/shop?q=learning",
  },
  {
    id: "baby",
    title: "Baby essentials",
    subtitle: "Practical newborn and baby care picks.",
    image: null,
    href: "/shop?q=baby",
  },
  {
    id: "fashion",
    title: "Kids fashion",
    subtitle: "Comfort-first clothing and accessories.",
    image: null,
    href: "/shop?q=fashion",
  },
];
