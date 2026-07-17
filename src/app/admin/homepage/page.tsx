import Link from "next/link";
import {
  Eye,
  GripVertical,
  Megaphone,
  PanelsTopLeft,
  Save,
  Sparkles,
} from "lucide-react";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { CmsImageField } from "@/components/admin/cms-image-field";
import { UnsavedChangeWarning } from "@/components/admin/unsaved-change-warning";
import { saveHomepageSettingsAction } from "@/app/actions/admin";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
import {
  defaultHomepageSettings,
  getHomepageSettings,
  type FlashSaleSettings,
  type HomeSectionSettings,
  type HomepageSettings,
  type ProductSectionSettings,
} from "@/server/site-settings";

export const dynamic = "force-dynamic";

const sectionKeys = [
  ["announcementBar", "Announcement bar"],
  ["hero", "Hero fallback"],
  ["featuredCategories", "Featured categories"],
  ["promotionalBanners", "Promotional banners"],
  ["trustBadges", "Service benefits"],
  ["flashSale", "Flash sale"],
  ["trending", "Trending products"],
  ["shopByAge", "Shop by age"],
  ["bestSellers", "Best sellers"],
  ["newArrivals", "New arrivals"],
  ["featuredBrands", "Featured brands"],
  ["testimonials", "Reviews"],
  ["blogPreview", "Blog"],
  ["newsletter", "Newsletter"],
] as const;

type Option = {
  id: string;
  label: string;
  meta?: string;
};

const blankHeroSlide: HomepageSettings["heroSlides"][number] = {
  ...defaultHomepageSettings.heroSlides[0],
  id: "",
  enabled: false,
  sortOrder: 99,
  title: "",
  highlightedText: "",
  subtitle: "",
  description: "",
  image: "",
  mobileImage: "",
};

const blankPromoCard: HomepageSettings["sidePromoCards"][number] = {
  ...defaultHomepageSettings.sidePromoCards[0],
  id: "",
  enabled: false,
  sortOrder: 99,
  title: "",
  subtitle: "",
  image: "",
  mobileImage: "",
};

const blankBenefit: HomepageSettings["serviceBenefits"][number] = {
  ...defaultHomepageSettings.serviceBenefits[0],
  id: "",
  enabled: false,
  sortOrder: 99,
  title: "",
  description: "",
};

const blankAgeGroup: HomepageSettings["ageGroups"][number] = {
  ...defaultHomepageSettings.ageGroups[0],
  id: "",
  enabled: false,
  sortOrder: 99,
  label: "",
  slug: "",
  description: "",
  image: "",
  link: "",
  ageAttribute: "",
};

const blankCollection: HomepageSettings["interestCollections"][number] = {
  ...defaultHomepageSettings.interestCollections[0],
  id: "",
  enabled: false,
  sortOrder: 99,
  name: "",
  description: "",
  image: "",
  link: "",
  categoryId: "",
  tags: [],
  productIds: [],
};

export default async function AdminHomepagePage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  await requirePermission("settings.update");
  const params = await searchParams;
  const [homepage, setting, categories, products, brands, posts, reviews] =
    await Promise.all([
      getHomepageSettings(),
      prisma.siteSetting.findUnique({
        where: { key: "homepage" },
        select: { updatedAt: true },
      }),
      prisma.category.findMany({
        where: { archivedAt: null, parentId: null },
        select: {
          id: true,
          name: true,
          slug: true,
          featured: true,
          _count: { select: { products: true } },
        },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
        take: 80,
      }),
      prisma.product.findMany({
        where: { status: "PUBLISHED", active: true, archivedAt: null },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          salePrice: true,
          regularPrice: true,
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 120,
      }),
      prisma.brand.findMany({
        select: {
          id: true,
          name: true,
          featured: true,
          _count: { select: { products: true } },
        },
        orderBy: [{ featured: "desc" }, { name: "asc" }],
        take: 80,
      }),
      prisma.blogPost.findMany({
        where: { draft: false },
        select: { id: true, title: true, readingTime: true },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 50,
      }),
      prisma.review.findMany({
        where: { status: "APPROVED" },
        select: {
          id: true,
          rating: true,
          text: true,
          product: { select: { name: true } },
        },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: 50,
      }),
    ]);

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    label: category.name,
    meta: `${category._count.products} products${category.featured ? " · featured" : ""}`,
  }));
  const productOptions = products.map((product) => ({
    id: product.id,
    label: product.name,
    meta: `${product.sku} · ${product.stock} in stock${
      product.salePrice ? " · on sale" : ""
    }`,
  }));
  const brandOptions = brands.map((brand) => ({
    id: brand.id,
    label: brand.name,
    meta: `${brand._count.products} products${brand.featured ? " · featured" : ""}`,
  }));
  const postOptions = posts.map((post) => ({
    id: post.id,
    label: post.title,
    meta: `${post.readingTime} min read`,
  }));
  const reviewOptions = reviews.map((review) => ({
    id: review.id,
    label: review.product.name,
    meta: `${review.rating} stars · ${review.text.slice(0, 56)}`,
  }));

  return (
    <AdminShell>
      <AdminHero
        title="Homepage CMS"
        description="Manage the saved homepage configuration with typed sections, scheduled content, catalog-backed selectors and honest fallbacks."
      />
      <form
        id="homepage-cms-form"
        action={saveHomepageSettingsAction}
        className="space-y-5"
      >
        <UnsavedChangeWarning formId="homepage-cms-form" />
        <div className="sticky top-20 z-20 rounded-lg border border-[var(--border)] bg-white/95 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-navy">
                Saved-state preview only
              </p>
              <p className="text-xs font-bold text-slate-500">
                Last saved:{" "}
                {setting?.updatedAt
                  ? setting.updatedAt.toLocaleString("en-BD")
                  : "using defaults"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                target="_blank"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--border)] px-4 text-sm font-black text-navy"
              >
                <Eye className="h-4 w-4" />
                Preview storefront
              </Link>
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-coral px-5 text-sm font-black text-white">
                <Save className="h-4 w-4" />
                Save homepage
              </button>
            </div>
          </div>
          {params?.saved ? (
            <p className="mt-3 rounded-md bg-teal/10 p-3 text-sm font-bold text-teal">
              Homepage settings saved.
            </p>
          ) : null}
          {params?.error ? (
            <p className="mt-3 rounded-md bg-coral/10 p-3 text-sm font-bold text-coral">
              {params.error}
            </p>
          ) : null}
        </div>

        <Panel
          title="Section Order"
          icon={<PanelsTopLeft className="h-5 w-5 text-coral" />}
          summary="Enable, rename, hide and reorder the major storefront bands."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {sectionKeys.map(([key, title]) => (
              <SectionEditor
                key={key}
                cmsKey={key}
                title={title}
                section={homepage[key]}
              />
            ))}
          </div>
        </Panel>

        <Panel
          title="Announcements"
          icon={<Megaphone className="h-5 w-5 text-coral" />}
          summary="Scheduled messages rotate in the header. Empty or expired rows are ignored."
        >
          <div className="grid gap-3">
            {rows(homepage.announcementMessages, 4, {
              id: "",
              enabled: false,
              message: "",
              link: "",
              icon: "sparkles",
              priority: 99,
              startDate: "",
              endDate: "",
            }).map((item, index) => (
              <div key={`${item.id}-${index}`} className="rounded-md bg-cream p-4">
                <RowHeader
                  label={`Message ${index + 1}`}
                  enabledName="announcement.enabled"
                  id={item.id || String(index)}
                  enabled={item.enabled}
                />
                <input name="announcement.id" type="hidden" defaultValue={item.id} />
                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  <Field label="Message" name="announcement.message" value={item.message} wide />
                  <Field label="Link" name="announcement.link" value={item.link} />
                  <Field label="Icon" name="announcement.icon" value={item.icon} />
                  <Field label="Priority" name="announcement.priority" value={String(item.priority)} type="number" />
                  <Field label="Start date" name="announcement.startDate" value={item.startDate} type="datetime-local" />
                  <Field label="End date" name="announcement.endDate" value={item.endDate} type="datetime-local" />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Hero Slides"
          icon={<Sparkles className="h-5 w-5 text-coral" />}
          summary="Create, schedule, sort and style hero slides. Only enabled in-window slides render."
        >
          <div className="grid gap-4">
            {rows(homepage.heroSlides, 4, blankHeroSlide).map(
              (slide, index) => (
                <div key={`${slide.id}-${index}`} className="rounded-md border border-[var(--border)] p-4">
                  <RowHeader
                    label={`Hero slide ${index + 1}`}
                    enabledName="heroSlide.enabled"
                    id={slide.id || String(index)}
                    enabled={slide.enabled}
                  />
                  <input name="heroSlide.id" type="hidden" defaultValue={slide.id} />
                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <Field label="Title" name="heroSlide.title" value={slide.title} wide />
                    <Field label="Highlight" name="heroSlide.highlightedText" value={slide.highlightedText} />
                    <Field label="Sort" name="heroSlide.sortOrder" value={String(slide.sortOrder)} type="number" />
                    <Field label="Subtitle" name="heroSlide.subtitle" value={slide.subtitle} textarea wide />
                    <Field label="Description" name="heroSlide.description" value={slide.description} textarea wide />
                    <ImageField label="Image" name="heroSlide.image" value={slide.image} />
                    <ImageField label="Mobile image" name="heroSlide.mobileImage" value={slide.mobileImage} />
                    <Field label="Primary label" name="heroSlide.primaryButtonLabel" value={slide.primaryButtonLabel} />
                    <Field label="Primary link" name="heroSlide.primaryButtonLink" value={slide.primaryButtonLink} />
                    <Field label="Secondary label" name="heroSlide.secondaryButtonLabel" value={slide.secondaryButtonLabel} />
                    <Field label="Secondary link" name="heroSlide.secondaryButtonLink" value={slide.secondaryButtonLink} />
                    <SelectField label="Alignment" name="heroSlide.alignment" value={slide.alignment} options={["left", "center", "right"]} />
                    <Field label="Background" name="heroSlide.backgroundStyle" value={slide.backgroundStyle} />
                    <Field label="Overlay %" name="heroSlide.overlayStrength" value={String(slide.overlayStrength)} type="number" />
                    <Field label="Duration ms" name="heroSlide.durationMs" value={String(slide.durationMs)} type="number" />
                    <Field label="Start date" name="heroSlide.startDate" value={slide.startDate} type="datetime-local" />
                    <Field label="End date" name="heroSlide.endDate" value={slide.endDate} type="datetime-local" />
                  </div>
                </div>
              ),
            )}
          </div>
        </Panel>

        <Panel
          title="Navigation And Categories"
          summary="Choose nav shortcuts, category tiles and hero shortcut categories from real catalog categories."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <MultiSelect
              label="Top navigation categories"
              name="navigation.topCategoryIds"
              options={categoryOptions}
              selected={homepage.navigation.topCategoryIds}
            />
            <MultiSelect
              label="Featured mega-menu categories"
              name="navigation.featuredCategoryIds"
              options={categoryOptions}
              selected={homepage.navigation.featuredCategoryIds}
            />
            <MultiSelect
              label="Hero shortcut categories"
              name="navigation.heroShortcutCategoryIds"
              options={categoryOptions}
              selected={homepage.navigation.heroShortcutCategoryIds}
            />
          </div>
          <div className="mt-4 grid gap-3">
            {rows(homepage.categorySelections, 8, {
              categoryId: "",
              displayTitle: "",
              imageOverride: "",
              linkOverride: "",
              sortOrder: 99,
            }).map((item, index) => (
              <div key={index} className="grid gap-3 rounded-md bg-cream p-3 md:grid-cols-5">
                <SelectOptionField label="Category" name="categorySelection.categoryId" value={item.categoryId} options={categoryOptions} />
                <Field label="Display title" name="categorySelection.displayTitle" value={item.displayTitle} />
                <ImageField label="Image override" name="categorySelection.imageOverride" value={item.imageOverride} />
                <Field label="Link override" name="categorySelection.linkOverride" value={item.linkOverride} />
                <Field label="Sort" name="categorySelection.sortOrder" value={String(item.sortOrder)} type="number" />
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Benefits And Promos"
          summary="Manage service benefit cards and promotional banners with placement, colours, images and schedules."
        >
          <h3 className="text-sm font-black uppercase text-slate-500">Service benefits</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {rows(homepage.serviceBenefits, 6, blankBenefit).map((item, index) => (
              <div key={`${item.id}-${index}`} className="rounded-md bg-cream p-3">
                <RowHeader label={`Benefit ${index + 1}`} enabledName="benefit.enabled" id={item.id || String(index)} enabled={item.enabled} />
                <input name="benefit.id" type="hidden" defaultValue={item.id} />
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Field label="Title" name="benefit.title" value={item.title} />
                  <Field label="Icon" name="benefit.icon" value={item.icon} />
                  <Field label="Sort" name="benefit.sortOrder" value={String(item.sortOrder)} type="number" />
                  <Field label="Description" name="benefit.description" value={item.description} textarea wide />
                </div>
              </div>
            ))}
          </div>
          <h3 className="mt-6 text-sm font-black uppercase text-slate-500">Promotional banners</h3>
          <div className="mt-3 grid gap-3">
            {rows(homepage.sidePromoCards, 5, blankPromoCard).map((promo, index) => (
              <div key={`${promo.id}-${index}`} className="rounded-md border border-[var(--border)] p-4">
                <RowHeader label={`Promo ${index + 1}`} enabledName="promo.enabled" id={promo.id || String(index)} enabled={promo.enabled} />
                <input name="promo.id" type="hidden" defaultValue={promo.id} />
                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  <Field label="Title" name="promo.title" value={promo.title} wide />
                  <Field label="Subtitle" name="promo.subtitle" value={promo.subtitle} textarea wide />
                  <ImageField label="Image" name="promo.image" value={promo.image} />
                  <ImageField label="Mobile image" name="promo.mobileImage" value={promo.mobileImage} />
                  <Field label="CTA label" name="promo.ctaLabel" value={promo.ctaLabel} />
                  <Field label="Link" name="promo.link" value={promo.link} />
                  <Field label="Background" name="promo.backgroundColour" value={promo.backgroundColour} type="color" />
                  <Field label="Text" name="promo.textColour" value={promo.textColour} type="color" />
                  <SelectField label="Size" name="promo.size" value={promo.size} options={["small", "medium", "large"]} />
                  <SelectField label="Placement" name="promo.placement" value={promo.placement} options={["home-upper", "home-middle", "category", "shop"]} />
                  <Field label="Sort" name="promo.sortOrder" value={String(promo.sortOrder)} type="number" />
                  <Field label="Start date" name="promo.startDate" value={promo.startDate} type="datetime-local" />
                  <Field label="End date" name="promo.endDate" value={promo.endDate} type="datetime-local" />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Product Sections"
          summary="Configure the product rails with automatic or manual selection using published active products only."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <ProductSectionControls title="Flash sale" prefix="flashSaleConfig" config={homepage.flashSaleConfig} products={productOptions} categories={categoryOptions} brands={brandOptions} extra="flash" />
            <ProductSectionControls title="Trending" prefix="trendingConfig" config={homepage.trendingConfig} products={productOptions} categories={categoryOptions} brands={brandOptions} extra="trending" />
            <ProductSectionControls title="Best sellers" prefix="bestSellerConfig" config={homepage.bestSellerConfig} products={productOptions} categories={categoryOptions} brands={brandOptions} extra="best" />
            <ProductSectionControls title="New arrivals" prefix="newArrivalConfig" config={homepage.newArrivalConfig} products={productOptions} categories={categoryOptions} brands={brandOptions} />
            <ProductSectionControls title="Recommended" prefix="recommendedConfig" config={homepage.recommendedConfig} products={productOptions} categories={categoryOptions} brands={brandOptions} />
            <div className="rounded-md bg-cream p-4">
              <label className="inline-flex items-center gap-2 text-sm font-black text-navy">
                <input name="dealOfDay.enabled" type="checkbox" defaultChecked={homepage.dealOfDay.enabled} />
                Deal of the Day enabled
              </label>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <SelectOptionField label="Product" name="dealOfDay.productId" value={homepage.dealOfDay.productId} options={productOptions} />
                <Field label="Variant ID" name="dealOfDay.variantId" value={homepage.dealOfDay.variantId} />
                <Field label="Title" name="dealOfDay.title" value={homepage.dealOfDay.title} />
                <Field label="CTA label" name="dealOfDay.ctaLabel" value={homepage.dealOfDay.ctaLabel} />
                <Field label="End date" name="dealOfDay.endDate" value={homepage.dealOfDay.endDate} type="datetime-local" />
                <Field label="Background" name="dealOfDay.backgroundStyle" value={homepage.dealOfDay.backgroundStyle} />
                <ImageField label="Image override" name="dealOfDay.imageOverride" value={homepage.dealOfDay.imageOverride} />
                <Field label="Description" name="dealOfDay.description" value={homepage.dealOfDay.description} textarea wide />
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Discovery Collections" summary="Age groups and interest collections map to real product age attributes, links, categories, tags or manual products.">
          <div className="grid gap-3 lg:grid-cols-3">
            {rows(homepage.ageGroups, 6, blankAgeGroup).map((group, index) => (
              <div key={`${group.id}-${index}`} className="rounded-md bg-cream p-3">
                <RowHeader label={`Age group ${index + 1}`} enabledName="ageGroup.enabled" id={group.id || String(index)} enabled={group.enabled} />
                <input name="ageGroup.id" type="hidden" defaultValue={group.id} />
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Field label="Label" name="ageGroup.label" value={group.label} />
                  <Field label="Slug" name="ageGroup.slug" value={group.slug} />
                  <Field label="Minimum months" name="ageGroup.minAge" value={String(group.minAge)} type="number" />
                  <Field label="Maximum months" name="ageGroup.maxAge" value={String(group.maxAge)} type="number" />
                  <Field label="Product age attribute" name="ageGroup.ageAttribute" value={group.ageAttribute} />
                  <Field label="Sort" name="ageGroup.sortOrder" value={String(group.sortOrder)} type="number" />
                  <ImageField label="Image" name="ageGroup.image" value={group.image} />
                  <Field label="Link" name="ageGroup.link" value={group.link} />
                  <Field label="Description" name="ageGroup.description" value={group.description} textarea wide />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {rows(homepage.interestCollections, 6, blankCollection).map((collection, index) => (
              <div key={`${collection.id}-${index}`} className="rounded-md border border-[var(--border)] p-3">
                <RowHeader label={`Collection ${index + 1}`} enabledName="collection.enabled" id={collection.id || String(index)} enabled={collection.enabled} />
                <input name="collection.id" type="hidden" defaultValue={collection.id} />
                <div className="mt-3 grid gap-3">
                  <Field label="Name" name="collection.name" value={collection.name} />
                  <Field label="Description" name="collection.description" value={collection.description} textarea />
                  <ImageField label="Image" name="collection.image" value={collection.image} />
                  <Field label="Link" name="collection.link" value={collection.link} />
                  <SelectOptionField label="Category" name="collection.categoryId" value={collection.categoryId} options={categoryOptions} />
                  <Field label="Tags, comma separated" name="collection.tags" value={collection.tags.join(", ")} />
                  <Field label="Manual product IDs, comma separated" name="collection.productIds" value={collection.productIds.join(", ")} />
                  <Field label="Sort" name="collection.sortOrder" value={String(collection.sortOrder)} type="number" />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Brands, Reviews, Blog And Newsletter" summary="Keep editorial content tied to approved reviews, published posts and active brands.">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-md bg-cream p-4">
              <h3 className="font-black text-navy">Featured brands</h3>
              <div className="mt-3 grid gap-3">
                {rows(homepage.featuredBrandSelections, 8, { brandId: "", displayName: "", logoOverride: "", sortOrder: 99 }).map((brand, index) => (
                  <div key={index} className="grid gap-2 md:grid-cols-4">
                    <SelectOptionField label="Brand" name="brandSelection.brandId" value={brand.brandId} options={brandOptions} />
                    <Field label="Display name" name="brandSelection.displayName" value={brand.displayName} />
                    <ImageField label="Logo override" name="brandSelection.logoOverride" value={brand.logoOverride} />
                    <Field label="Sort" name="brandSelection.sortOrder" value={String(brand.sortOrder)} type="number" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-md bg-cream p-4">
              <h3 className="font-black text-navy">Reviews</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="inline-flex items-center gap-2 text-sm font-black text-navy">
                  <input name="reviewsConfig.featuredOnly" type="checkbox" defaultChecked={homepage.reviewsConfig.featuredOnly} />
                  Featured only
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-black text-navy">
                  <input name="reviewsConfig.showVerifiedBadge" type="checkbox" defaultChecked={homepage.reviewsConfig.showVerifiedBadge} />
                  Show verified badge
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-black text-navy">
                  <input name="reviewsConfig.showProductLink" type="checkbox" defaultChecked={homepage.reviewsConfig.showProductLink} />
                  Link to product
                </label>
                <Field label="Minimum rating" name="reviewsConfig.minimumRating" value={String(homepage.reviewsConfig.minimumRating)} type="number" />
                <Field label="Maximum items" name="reviewsConfig.maxItems" value={String(homepage.reviewsConfig.maxItems)} type="number" />
              </div>
              <div className="mt-3">
                <MultiSelect label="Manual approved reviews" name="reviewsConfig.reviewIds" options={reviewOptions} selected={homepage.reviewsConfig.reviewIds} />
              </div>
            </div>
            <div className="rounded-md bg-cream p-4">
              <h3 className="font-black text-navy">Blog</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <SelectField label="Mode" name="blogConfig.mode" value={homepage.blogConfig.mode} options={["latest", "featured", "manual"]} />
                <Field label="Maximum posts" name="blogConfig.maxItems" value={String(homepage.blogConfig.maxItems)} type="number" />
                <Field label="Blog category" name="blogConfig.category" value={homepage.blogConfig.category} />
                <label className="inline-flex items-center gap-2 text-sm font-black text-navy">
                  <input name="blogConfig.showExcerpt" type="checkbox" defaultChecked={homepage.blogConfig.showExcerpt} />
                  Show excerpt
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-black text-navy">
                  <input name="blogConfig.showReadingTime" type="checkbox" defaultChecked={homepage.blogConfig.showReadingTime} />
                  Show reading time
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-black text-navy">
                  <input name="blogConfig.showCategory" type="checkbox" defaultChecked={homepage.blogConfig.showCategory} />
                  Show category
                </label>
              </div>
              <div className="mt-3">
                <MultiSelect label="Manual published posts" name="blogConfig.postIds" options={postOptions} selected={homepage.blogConfig.postIds} />
              </div>
            </div>
            <div className="rounded-md bg-cream p-4">
              <h3 className="font-black text-navy">Newsletter</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field label="Button label" name="newsletterConfig.buttonLabel" value={homepage.newsletterConfig.buttonLabel} />
                <ImageField label="Image" name="newsletterConfig.image" value={homepage.newsletterConfig.image} />
                <Field label="Privacy note" name="newsletterConfig.privacyNote" value={homepage.newsletterConfig.privacyNote} textarea wide />
                <Field label="Success message" name="newsletterConfig.successMessage" value={homepage.newsletterConfig.successMessage} wide />
              </div>
            </div>
          </div>
        </Panel>
      </form>
    </AdminShell>
  );
}

function Panel({
  title,
  summary,
  icon,
  children,
}: {
  title: string;
  summary: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <details open className="kg-card overflow-hidden">
      <summary className="flex cursor-pointer items-center justify-between gap-4 border-b border-[var(--border)] p-5">
        <span className="flex min-w-0 items-center gap-3">
          {icon}
          <span>
            <span className="block text-lg font-black text-navy">{title}</span>
            <span className="block text-sm font-semibold text-slate-500">
              {summary}
            </span>
          </span>
        </span>
      </summary>
      <div className="p-5">{children}</div>
    </details>
  );
}

function SectionEditor({
  cmsKey,
  title,
  section,
}: {
  cmsKey: string;
  title: string;
  section: HomeSectionSettings & Record<string, string | number | boolean>;
}) {
  const prefix = `homepage.${cmsKey}`;
  return (
    <div className="rounded-md border border-[var(--border)] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-black text-navy">
          <GripVertical className="h-4 w-4 text-slate-400" />
          {title}
        </span>
        <label className="inline-flex items-center gap-2 text-sm font-bold text-navy">
          <input
            name={`${prefix}.enabled`}
            type="checkbox"
            defaultChecked={section.enabled}
          />
          Enabled
        </label>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Field label="Title" name={`${prefix}.title`} value={section.title} />
        <Field
          label="Sort"
          name={`${prefix}.sortOrder`}
          value={String(section.sortOrder)}
          type="number"
        />
        <Field
          label="Maximum"
          name={`${prefix}.maxItems`}
          value={String(section.maxItems ?? 8)}
          type="number"
        />
        <Field label="Link" name={`${prefix}.link`} value={section.link} />
        <Field
          label="Subtitle"
          name={`${prefix}.subtitle`}
          value={section.subtitle}
          textarea
          wide
        />
        <ImageField label="Image" name={`${prefix}.image`} value={section.image} />
        <Field
          label="Background"
          name={`${prefix}.backgroundStyle`}
          value={section.backgroundStyle}
        />
        {"highlightedText" in section ? (
          <Field
            label="Highlight"
            name={`${prefix}.highlightedText`}
            value={String(section.highlightedText ?? "")}
          />
        ) : null}
        {"primaryButtonLabel" in section ? (
          <>
            <Field
              label="Primary label"
              name={`${prefix}.primaryButtonLabel`}
              value={String(section.primaryButtonLabel ?? "")}
            />
            <Field
              label="Primary link"
              name={`${prefix}.primaryButtonLink`}
              value={String(section.primaryButtonLink ?? "")}
            />
            <Field
              label="Secondary label"
              name={`${prefix}.secondaryButtonLabel`}
              value={String(section.secondaryButtonLabel ?? "")}
            />
            <Field
              label="Secondary link"
              name={`${prefix}.secondaryButtonLink`}
              value={String(section.secondaryButtonLink ?? "")}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

function ProductSectionControls({
  title,
  prefix,
  config,
  products,
  categories,
  brands,
  extra,
}: {
  title: string;
  prefix: string;
  config:
    | ProductSectionSettings
    | FlashSaleSettings
    | HomepageSettings["trendingConfig"]
    | HomepageSettings["bestSellerConfig"];
  products: Option[];
  categories: Option[];
  brands: Option[];
  extra?: "flash" | "trending" | "best";
}) {
  const flashConfig = extra === "flash" ? (config as FlashSaleSettings) : null;
  const trendingConfig =
    extra === "trending" ? (config as HomepageSettings["trendingConfig"]) : null;
  const bestConfig =
    extra === "best" ? (config as HomepageSettings["bestSellerConfig"]) : null;
  return (
    <div className="rounded-md bg-cream p-4">
      <h3 className="font-black text-navy">{title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <SelectField
          label="Mode"
          name={`${prefix}.mode`}
          value={config.mode}
          options={["automatic", "manual"]}
        />
        <Field
          label="Sort method"
          name={`${prefix}.sortMethod`}
          value={config.sortMethod}
        />
        <Field
          label="Fallback strategy"
          name={`${prefix}.fallbackStrategy`}
          value={config.fallbackStrategy}
        />
        <Field
          label="Published within days"
          name={`${prefix}.publishedWithinDays`}
          value={String(config.publishedWithinDays)}
          type="number"
        />
        <Field
          label="Date range"
          name={`${prefix}.dateRange`}
          value={config.dateRange}
        />
        {flashConfig ? (
          <>
            <Field
              label="Countdown end"
              name={`${prefix}.countdownEndDate`}
              value={String(flashConfig.countdownEndDate)}
              type="datetime-local"
            />
            <Field
              label="Start date"
              name={`${prefix}.startDate`}
              value={String(flashConfig.startDate)}
              type="datetime-local"
            />
            <Field
              label="End date"
              name={`${prefix}.endDate`}
              value={String(flashConfig.endDate)}
              type="datetime-local"
            />
            <label className="inline-flex items-center gap-2 text-sm font-black text-navy">
              <input
                name={`${prefix}.hideWhenExpired`}
                type="checkbox"
                defaultChecked={Boolean(flashConfig.hideWhenExpired)}
              />
              Hide when expired
            </label>
          </>
        ) : null}
        {trendingConfig ? (
          <SelectOptionField
            label="Default tab"
            name={`${prefix}.defaultTabCategoryId`}
            value={trendingConfig.defaultTabCategoryId}
            options={categories}
          />
        ) : null}
        {bestConfig ? (
          <label className="inline-flex items-center gap-2 text-sm font-black text-navy">
            <input
              name={`${prefix}.useOrderData`}
              type="checkbox"
              defaultChecked={Boolean(bestConfig.useOrderData)}
            />
            Use successful order data
          </label>
        ) : null}
      </div>
      <div className="mt-3 grid gap-3">
        <MultiSelect
          label="Manual products"
          name={`${prefix}.productIds`}
          options={products}
          selected={config.productIds}
        />
        <MultiSelect
          label="Category filter"
          name={`${prefix}.categoryIds`}
          options={categories}
          selected={config.categoryIds}
        />
        <MultiSelect
          label="Brand filter"
          name={`${prefix}.brandIds`}
          options={brands}
          selected={config.brandIds}
        />
        {trendingConfig ? (
          <MultiSelect
            label="Product tab categories"
            name={`${prefix}.tabCategoryIds`}
            options={categories}
            selected={trendingConfig.tabCategoryIds}
          />
        ) : null}
      </div>
    </div>
  );
}

function MultiSelect({
  label,
  name,
  options,
  selected,
}: {
  label: string;
  name: string;
  options: Option[];
  selected: string[];
}) {
  const selectedSet = new Set(selected);
  return (
    <label>
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <select
        name={name}
        multiple
        defaultValue={selected}
        className="mt-1 min-h-36 w-full rounded-md border border-[var(--border)] bg-white p-2 text-sm"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {selectedSet.has(option.id) ? "✓ " : ""}
            {option.label}
            {option.meta ? ` · ${option.meta}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectOptionField({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: Option[];
}) {
  return (
    <label>
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="mt-1 h-11 w-full rounded-md border border-[var(--border)] bg-white px-3"
      >
        <option value="">Automatic</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
}) {
  return (
    <label>
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="mt-1 h-11 w-full rounded-md border border-[var(--border)] bg-white px-3"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function RowHeader({
  label,
  enabledName,
  id,
  enabled,
}: {
  label: string;
  enabledName: string;
  id: string;
  enabled: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-black text-navy">{label}</h3>
      <label className="inline-flex items-center gap-2 text-sm font-bold text-navy">
        <input name={enabledName} type="checkbox" value={id} defaultChecked={enabled} />
        Enabled
      </label>
    </div>
  );
}

function ImageField({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: string;
}) {
  return <CmsImageField label={label} name={name} value={value} />;
}

function Field({
  label,
  name,
  value,
  type = "text",
  textarea = false,
  wide = false,
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
  textarea?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "md:col-span-2" : ""}>
      <span className="text-sm font-bold text-slate-600">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={value}
          rows={3}
          className="mt-1 w-full rounded-md border border-[var(--border)] p-3"
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={value}
          className="mt-1 h-11 w-full rounded-md border border-[var(--border)] p-3"
        />
      )}
    </label>
  );
}

function rows<T>(items: T[], minimum: number, empty: T) {
  const output = [...items];
  while (output.length < minimum) output.push(empty);
  return output;
}
