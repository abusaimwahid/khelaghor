import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./db";

export type GeneralSettings = {
  storeName: string;
  storeNameBn: string;
  tagline: string;
  taglineBn: string;
  businessDescription: string;
  businessDescriptionBn: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  address: string;
  businessHours: string;
  currency: string;
  timezone: string;
  defaultLanguage: string;
};

export type BrandingSettings = {
  mainLogo: string;
  compactLogo: string;
  darkLogo: string;
  lightLogo: string;
  favicon: string;
  primaryColour: string;
  secondaryColour: string;
  accentColour: string;
  footerLogo: string;
  openGraphImage: string;
  defaultProductImage: string;
  defaultCategoryImage: string;
  emailLogo: string;
  invoiceLogo: string;
};

export type CommerceSettings = {
  defaultDeliveryCharge: number;
  freeDeliveryThreshold: number;
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  taxEnabled: boolean;
  taxPercentage: number;
  minimumOrderValue: number;
  maximumOrderValue: number;
  orderPrefix: string;
  invoicePrefix: string;
  lowStockDefaultThreshold: number;
  defaultDeliveryZoneSlug: string;
  freeDeliveryMessage: string;
  storePickupInstructions: string;
  deliveryEstimateWording: string;
  expressDeliveryEnabled: boolean;
};

export type SocialSettings = {
  facebook: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  linkedin: string;
  whatsapp: string;
};

export type SeoSettings = {
  defaultPageTitle: string;
  defaultMetaDescription: string;
  defaultKeywords: string;
  openGraphImage: string;
  canonicalSiteUrl: string;
  robotsSettings: string;
};

export type SiteSettings = {
  general: GeneralSettings;
  branding: BrandingSettings;
  commerce: CommerceSettings;
  social: SocialSettings;
  seo: SeoSettings;
};

export type HomeSectionSettings = {
  enabled: boolean;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  backgroundStyle: string;
  sortOrder: number;
  maxItems: number;
};

export type DateWindow = {
  startDate: string;
  endDate: string;
};

export type AnnouncementMessage = DateWindow & {
  id: string;
  enabled: boolean;
  message: string;
  link: string;
  icon: string;
  priority: number;
};

export type HeroSlideSettings = DateWindow & {
  id: string;
  enabled: boolean;
  sortOrder: number;
  title: string;
  highlightedText: string;
  subtitle: string;
  description: string;
  image: string;
  mobileImage: string;
  primaryButtonLabel: string;
  primaryButtonLink: string;
  secondaryButtonLabel: string;
  secondaryButtonLink: string;
  alignment: "left" | "center" | "right";
  backgroundStyle: string;
  overlayStrength: number;
  durationMs: number;
};

export type PromoCardSettings = DateWindow & {
  id: string;
  enabled: boolean;
  sortOrder: number;
  title: string;
  subtitle: string;
  image: string;
  mobileImage: string;
  ctaLabel: string;
  link: string;
  backgroundColour: string;
  textColour: string;
  size: "small" | "medium" | "large";
  placement: "home-upper" | "home-middle" | "category" | "shop";
};

export type CategorySelectionSettings = {
  categoryId: string;
  displayTitle: string;
  imageOverride: string;
  linkOverride: string;
  sortOrder: number;
};

export type ServiceBenefitSettings = {
  id: string;
  enabled: boolean;
  sortOrder: number;
  icon: string;
  title: string;
  description: string;
};

export type ProductSectionSettings = {
  mode: "automatic" | "manual";
  productIds: string[];
  categoryIds: string[];
  brandIds: string[];
  sortMethod: string;
  fallbackStrategy: string;
  publishedWithinDays: number;
  dateRange: string;
};

export type FlashSaleSettings = ProductSectionSettings & DateWindow & {
  countdownEndDate: string;
  hideWhenExpired: boolean;
};

export type AgeGroupSettings = {
  id: string;
  enabled: boolean;
  sortOrder: number;
  label: string;
  slug: string;
  minAge: number;
  maxAge: number;
  description: string;
  image: string;
  link: string;
  ageAttribute: string;
};

export type BrandSelectionSettings = {
  brandId: string;
  displayName: string;
  logoOverride: string;
  sortOrder: number;
};

export type DealOfDaySettings = {
  enabled: boolean;
  productId: string;
  variantId: string;
  title: string;
  description: string;
  endDate: string;
  ctaLabel: string;
  backgroundStyle: string;
  imageOverride: string;
};

export type InterestCollectionSettings = {
  id: string;
  enabled: boolean;
  sortOrder: number;
  name: string;
  description: string;
  image: string;
  link: string;
  categoryId: string;
  tags: string[];
  productIds: string[];
};

export type ReviewsSectionSettings = {
  approvedOnly: boolean;
  featuredOnly: boolean;
  minimumRating: number;
  maxItems: number;
  reviewIds: string[];
  showVerifiedBadge: boolean;
  showProductLink: boolean;
};

export type BlogSectionSettings = {
  mode: "latest" | "featured" | "manual";
  postIds: string[];
  category: string;
  maxItems: number;
  showExcerpt: boolean;
  showReadingTime: boolean;
  showCategory: boolean;
};

export type HomepageSettings = {
  announcementBar: HomeSectionSettings & { highlightedText: string };
  announcementMessages: AnnouncementMessage[];
  hero: HomeSectionSettings & {
    highlightedText: string;
    primaryButtonLabel: string;
    primaryButtonLink: string;
    secondaryButtonLabel: string;
    secondaryButtonLink: string;
  };
  heroSlides: HeroSlideSettings[];
  sidePromoCards: PromoCardSettings[];
  navigation: {
    topCategoryIds: string[];
    featuredCategoryIds: string[];
    heroShortcutCategoryIds: string[];
  };
  categorySelections: CategorySelectionSettings[];
  serviceBenefits: ServiceBenefitSettings[];
  flashSaleConfig: FlashSaleSettings;
  trendingConfig: ProductSectionSettings & {
    tabCategoryIds: string[];
    defaultTabCategoryId: string;
  };
  bestSellerConfig: ProductSectionSettings & { useOrderData: boolean };
  newArrivalConfig: ProductSectionSettings;
  ageGroups: AgeGroupSettings[];
  featuredBrandSelections: BrandSelectionSettings[];
  dealOfDay: DealOfDaySettings;
  interestCollections: InterestCollectionSettings[];
  recommendedConfig: ProductSectionSettings;
  reviewsConfig: ReviewsSectionSettings;
  blogConfig: BlogSectionSettings;
  newsletterConfig: {
    buttonLabel: string;
    privacyNote: string;
    image: string;
    successMessage: string;
  };
  featuredCategories: HomeSectionSettings;
  promotionalBanners: HomeSectionSettings;
  trustBadges: HomeSectionSettings;
  trending: HomeSectionSettings;
  newArrivals: HomeSectionSettings;
  bestSellers: HomeSectionSettings;
  flashSale: HomeSectionSettings;
  shopByAge: HomeSectionSettings;
  shopByGender: HomeSectionSettings;
  featuredBrands: HomeSectionSettings;
  testimonials: HomeSectionSettings;
  blogPreview: HomeSectionSettings;
  newsletter: HomeSectionSettings;
};

export const defaultSiteSettings: SiteSettings = {
  general: {
    storeName: "KhelaGhor",
    storeNameBn: "খেলাঘর",
    tagline: "Play. Smile. Learn.",
    taglineBn: "খেলি। হাসি। শিখি।",
    businessDescription:
      "A Bangladesh-first children’s store for safe toys, books, baby care, school supplies and gifts.",
    businessDescriptionBn:
      "নিরাপদ খেলনা, বই, শিশুযত্ন, স্কুল সামগ্রী ও উপহারের জন্য বাংলাদেশের শিশুদের দোকান।",
    supportEmail: "",
    supportPhone: "",
    whatsappNumber: "",
    address: "",
    businessHours: "",
    currency: "BDT",
    timezone: "Asia/Dhaka",
    defaultLanguage: "en",
  },
  branding: {
    mainLogo: "",
    compactLogo: "",
    darkLogo: "",
    lightLogo: "",
    favicon: "",
    primaryColour: "#10264a",
    secondaryColour: "#18a999",
    accentColour: "#ff6b6b",
    footerLogo: "",
    openGraphImage: "",
    defaultProductImage: "",
    defaultCategoryImage: "",
    emailLogo: "",
    invoiceLogo: "",
  },
  commerce: {
    defaultDeliveryCharge: 80,
    freeDeliveryThreshold: 3000,
    codEnabled: true,
    onlinePaymentEnabled: true,
    taxEnabled: false,
    taxPercentage: 0,
    minimumOrderValue: 0,
    maximumOrderValue: 0,
    orderPrefix: "KG",
    invoicePrefix: "INV",
    lowStockDefaultThreshold: 5,
    defaultDeliveryZoneSlug: "outside-dhaka",
    freeDeliveryMessage: "Free delivery applies when the configured zone threshold is met.",
    storePickupInstructions: "Pickup from KhelaGhor after order confirmation.",
    deliveryEstimateWording: "Estimated delivery",
    expressDeliveryEnabled: true,
  },
  social: {
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
    linkedin: "",
    whatsapp: "",
  },
  seo: {
    defaultPageTitle: "KhelaGhor | Play. Learn. Grow Together.",
    defaultMetaDescription:
      "A premium children’s eCommerce platform for Bangladesh selling toys, books, clothing, baby care, school supplies and gifts.",
    defaultKeywords: "toys, books, baby care, kids store, Bangladesh",
    openGraphImage: "",
    canonicalSiteUrl:
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000",
    robotsSettings: "index,follow",
  },
};

const section = (
  title: string,
  subtitle = "",
  link = "",
  sortOrder = 0,
): HomeSectionSettings => ({
  enabled: true,
  title,
  subtitle,
  image: "",
  link,
  backgroundStyle: "default",
  sortOrder,
  maxItems: 8,
});

export const defaultHomepageSettings: HomepageSettings = {
  announcementBar: {
    ...section(
      "Delivery across Bangladesh",
      "Free delivery threshold is configured in Commerce settings.",
      "",
      0,
    ),
    highlightedText: "Local development mode",
  },
  announcementMessages: [
    {
      id: "delivery",
      enabled: true,
      message: "Delivery across Bangladesh",
      link: "/shipping",
      icon: "truck",
      priority: 1,
      startDate: "",
      endDate: "",
    },
    {
      id: "cod",
      enabled: true,
      message: "Cash on Delivery available on eligible orders",
      link: "/shop",
      icon: "cash",
      priority: 2,
      startDate: "",
      endDate: "",
    },
  ],
  hero: {
    ...section(
      "Play. Learn. Grow Together.",
      "Safe toys, helpful books, newborn essentials and school-ready favourites selected for curious children and practical parents.",
      "/shop",
      1,
    ),
    highlightedText: "Bangladesh’s joyful kids store",
    primaryButtonLabel: "Shop Now",
    primaryButtonLink: "/shop",
    secondaryButtonLabel: "Explore Categories",
    secondaryButtonLink: "/categories",
  },
  heroSlides: [
    {
      id: "main-hero",
      enabled: true,
      sortOrder: 1,
      title: "Play. Learn. Grow Together.",
      highlightedText: "Bangladesh’s joyful kids store",
      subtitle:
        "Safe toys, helpful books, newborn essentials and school-ready favourites.",
      description:
        "Curated picks for curious children and practical parents, all wired to your real product catalog.",
      image: "",
      mobileImage: "",
      primaryButtonLabel: "Shop Now",
      primaryButtonLink: "/shop",
      secondaryButtonLabel: "Explore Categories",
      secondaryButtonLink: "/categories",
      alignment: "left",
      backgroundStyle: "linear-gradient(135deg, #10264a, #16a394)",
      overlayStrength: 35,
      durationMs: 5200,
      startDate: "",
      endDate: "",
    },
  ],
  sidePromoCards: [
    {
      id: "learning-through-play",
      enabled: true,
      sortOrder: 1,
      title: "Learning through play",
      subtitle: "Toys and books that support curious children.",
      image: "",
      mobileImage: "",
      ctaLabel: "Shop now",
      link: "/shop?q=learning",
      backgroundColour: "#ffffff",
      textColour: "#10264a",
      size: "medium",
      placement: "home-upper",
      startDate: "",
      endDate: "",
    },
    {
      id: "baby-essentials",
      enabled: true,
      sortOrder: 2,
      title: "Baby essentials",
      subtitle: "Practical newborn and baby care picks.",
      image: "",
      mobileImage: "",
      ctaLabel: "Shop now",
      link: "/shop?q=baby",
      backgroundColour: "#18a999",
      textColour: "#ffffff",
      size: "medium",
      placement: "home-upper",
      startDate: "",
      endDate: "",
    },
  ],
  navigation: {
    topCategoryIds: [],
    featuredCategoryIds: [],
    heroShortcutCategoryIds: [],
  },
  categorySelections: [],
  serviceBenefits: [
    {
      id: "safe-products",
      enabled: true,
      sortOrder: 1,
      icon: "shield",
      title: "Safe Products",
      description: "Catalog items curated for families.",
    },
    {
      id: "fast-delivery",
      enabled: true,
      sortOrder: 2,
      icon: "truck",
      title: "Fast Delivery",
      description: "Local delivery settings controlled by admin.",
    },
    {
      id: "easy-returns",
      enabled: true,
      sortOrder: 3,
      icon: "returns",
      title: "Easy Returns",
      description: "Clear post-purchase support paths.",
    },
    {
      id: "secure-payment",
      enabled: true,
      sortOrder: 4,
      icon: "payment",
      title: "Secure Payment",
      description: "Configured payment methods only.",
    },
    {
      id: "cash-on-delivery",
      enabled: true,
      sortOrder: 5,
      icon: "cod",
      title: "Cash on Delivery",
      description: "Shown when enabled in commerce settings.",
    },
    {
      id: "support",
      enabled: true,
      sortOrder: 6,
      icon: "support",
      title: "Customer Support",
      description: "Store contact details come from settings.",
    },
  ],
  featuredCategories: section("Shop By Category", "", "/categories", 2),
  promotionalBanners: section(
    "Promotional Banners",
    "Manage banners from the CMS.",
    "/offers",
    3,
  ),
  trustBadges: section("Why Parents Choose Us", "", "", 4),
  trending: section("Trending Products", "", "/shop", 5),
  newArrivals: section("New Arrivals", "", "/new-arrivals", 6),
  bestSellers: section("Best Sellers", "", "/best-sellers", 7),
  flashSale: section(
    "Flash Sale",
    "Products with active sale pricing.",
    "/flash-sale",
    8,
  ),
  shopByAge: section("Shop By Age", "", "/shop", 9),
  shopByGender: section("Shop By Gender", "", "/shop", 10),
  featuredBrands: section("Featured Brands", "", "/brands", 11),
  testimonials: section(
    "Parent Reviews",
    "Awaiting approved customer reviews.",
    "",
    12,
  ),
  blogPreview: section("Recent Blog Posts", "", "/blog", 13),
  newsletter: section("Newsletter", "Get product updates and offers.", "", 14),
  flashSaleConfig: {
    mode: "automatic",
    productIds: [],
    categoryIds: [],
    brandIds: [],
    sortMethod: "strongest-discount",
    fallbackStrategy: "hide",
    publishedWithinDays: 30,
    dateRange: "",
    countdownEndDate: "",
    hideWhenExpired: true,
    startDate: "",
    endDate: "",
  },
  trendingConfig: {
    mode: "automatic",
    productIds: [],
    categoryIds: [],
    brandIds: [],
    sortMethod: "featured",
    fallbackStrategy: "popular-products",
    publishedWithinDays: 30,
    dateRange: "",
    tabCategoryIds: [],
    defaultTabCategoryId: "",
  },
  bestSellerConfig: {
    mode: "automatic",
    productIds: [],
    categoryIds: [],
    brandIds: [],
    sortMethod: "order-quantity",
    fallbackStrategy: "bestSeller-flag",
    publishedWithinDays: 30,
    dateRange: "",
    useOrderData: true,
  },
  newArrivalConfig: {
    mode: "automatic",
    productIds: [],
    categoryIds: [],
    brandIds: [],
    sortMethod: "newest",
    fallbackStrategy: "newArrival-flag",
    publishedWithinDays: 30,
    dateRange: "",
  },
  ageGroups: [
    {
      id: "0-6-months",
      enabled: true,
      sortOrder: 1,
      label: "0-6 months",
      slug: "0-6-months",
      minAge: 0,
      maxAge: 6,
      description: "Soft, sensory and newborn-safe",
      image: "",
      link: "/shop?age=0-6%20months",
      ageAttribute: "0-6 months",
    },
    {
      id: "3-5-years",
      enabled: true,
      sortOrder: 2,
      label: "3-5 years",
      slug: "3-5-years",
      minAge: 36,
      maxAge: 60,
      description: "Creative preschool play",
      image: "",
      link: "/shop?age=3-5%20years",
      ageAttribute: "3-5 years",
    },
    {
      id: "6-8-years",
      enabled: true,
      sortOrder: 3,
      label: "6-8 years",
      slug: "6-8-years",
      minAge: 72,
      maxAge: 96,
      description: "School-ready learning",
      image: "",
      link: "/shop?age=6-8%20years",
      ageAttribute: "6-8 years",
    },
  ],
  featuredBrandSelections: [],
  dealOfDay: {
    enabled: true,
    productId: "",
    variantId: "",
    title: "Deal of the Day",
    description: "",
    endDate: "",
    ctaLabel: "View product",
    backgroundStyle: "#ffffff",
    imageOverride: "",
  },
  interestCollections: [
    {
      id: "creative-play",
      enabled: true,
      sortOrder: 1,
      name: "Creative Play",
      description: "Art, craft and imagination",
      image: "",
      link: "/shop?tag=creative",
      categoryId: "",
      tags: ["creative"],
      productIds: [],
    },
    {
      id: "stem-learning",
      enabled: true,
      sortOrder: 2,
      name: "STEM Learning",
      description: "Build, test and discover",
      image: "",
      link: "/shop?q=STEM",
      categoryId: "",
      tags: ["STEM"],
      productIds: [],
    },
    {
      id: "newborn-care",
      enabled: true,
      sortOrder: 3,
      name: "Newborn Care",
      description: "Gentle everyday essentials",
      image: "",
      link: "/shop?q=newborn",
      categoryId: "",
      tags: ["newborn"],
      productIds: [],
    },
  ],
  recommendedConfig: {
    mode: "automatic",
    productIds: [],
    categoryIds: [],
    brandIds: [],
    sortMethod: "featured",
    fallbackStrategy: "popular-products",
    publishedWithinDays: 30,
    dateRange: "",
  },
  reviewsConfig: {
    approvedOnly: true,
    featuredOnly: false,
    minimumRating: 4,
    maxItems: 3,
    reviewIds: [],
    showVerifiedBadge: true,
    showProductLink: true,
  },
  blogConfig: {
    mode: "latest",
    postIds: [],
    category: "",
    maxItems: 3,
    showExcerpt: true,
    showReadingTime: true,
    showCategory: false,
  },
  newsletterConfig: {
    buttonLabel: "Subscribe",
    privacyNote: "We only use your email for KhelaGhor updates.",
    image: "",
    successMessage: "Thanks for subscribing.",
  },
};

const text = z.string().trim().max(800).catch("");
const shortText = z.string().trim().max(160).catch("");
const idArray = z.array(z.string().trim().min(1)).catch([]);
const sectionSchema = z.object({
  enabled: z.boolean().catch(true),
  title: shortText,
  subtitle: text,
  image: text,
  link: text,
  backgroundStyle: shortText,
  sortOrder: z.coerce.number().int().min(0).max(999).catch(0),
  maxItems: z.coerce.number().int().min(0).max(48).catch(8),
});

const dateWindowFields = {
  startDate: shortText,
  endDate: shortText,
};

const productSectionSchema = z.object({
  mode: z.enum(["automatic", "manual"]).catch("automatic"),
  productIds: idArray,
  categoryIds: idArray,
  brandIds: idArray,
  sortMethod: shortText,
  fallbackStrategy: shortText,
  publishedWithinDays: z.coerce.number().int().min(0).max(3650).catch(30),
  dateRange: shortText,
});

export const homepageSettingsSchema: z.ZodType<HomepageSettings> = z.object({
  announcementBar: sectionSchema.extend({ highlightedText: shortText }),
  announcementMessages: z
    .array(
      z.object({
        ...dateWindowFields,
        id: shortText,
        enabled: z.boolean().catch(true),
        message: shortText,
        link: text,
        icon: shortText,
        priority: z.coerce.number().int().min(0).max(999).catch(0),
      }),
    )
    .catch([]),
  hero: sectionSchema.extend({
    highlightedText: shortText,
    primaryButtonLabel: shortText,
    primaryButtonLink: text,
    secondaryButtonLabel: shortText,
    secondaryButtonLink: text,
  }),
  heroSlides: z
    .array(
      z.object({
        ...dateWindowFields,
        id: shortText,
        enabled: z.boolean().catch(true),
        sortOrder: z.coerce.number().int().min(0).max(999).catch(0),
        title: shortText,
        highlightedText: shortText,
        subtitle: text,
        description: text,
        image: text,
        mobileImage: text,
        primaryButtonLabel: shortText,
        primaryButtonLink: text,
        secondaryButtonLabel: shortText,
        secondaryButtonLink: text,
        alignment: z.enum(["left", "center", "right"]).catch("left"),
        backgroundStyle: shortText,
        overlayStrength: z.coerce.number().min(0).max(90).catch(35),
        durationMs: z.coerce.number().int().min(2500).max(20000).catch(5200),
      }),
    )
    .catch([]),
  sidePromoCards: z
    .array(
      z.object({
        ...dateWindowFields,
        id: shortText,
        enabled: z.boolean().catch(true),
        sortOrder: z.coerce.number().int().min(0).max(999).catch(0),
        title: shortText,
        subtitle: text,
        image: text,
        mobileImage: text,
        ctaLabel: shortText,
        link: text,
        backgroundColour: shortText,
        textColour: shortText,
        size: z.enum(["small", "medium", "large"]).catch("medium"),
        placement: z
          .enum(["home-upper", "home-middle", "category", "shop"])
          .catch("home-upper"),
      }),
    )
    .catch([]),
  navigation: z.object({
    topCategoryIds: idArray,
    featuredCategoryIds: idArray,
    heroShortcutCategoryIds: idArray,
  }),
  categorySelections: z
    .array(
      z.object({
        categoryId: shortText,
        displayTitle: shortText,
        imageOverride: text,
        linkOverride: text,
        sortOrder: z.coerce.number().int().min(0).max(999).catch(0),
      }),
    )
    .catch([]),
  serviceBenefits: z
    .array(
      z.object({
        id: shortText,
        enabled: z.boolean().catch(true),
        sortOrder: z.coerce.number().int().min(0).max(999).catch(0),
        icon: shortText,
        title: shortText,
        description: text,
      }),
    )
    .catch([]),
  featuredCategories: sectionSchema,
  promotionalBanners: sectionSchema,
  trustBadges: sectionSchema,
  trending: sectionSchema,
  newArrivals: sectionSchema,
  bestSellers: sectionSchema,
  flashSale: sectionSchema,
  shopByAge: sectionSchema,
  shopByGender: sectionSchema,
  featuredBrands: sectionSchema,
  testimonials: sectionSchema,
  blogPreview: sectionSchema,
  newsletter: sectionSchema,
  flashSaleConfig: productSectionSchema.extend({
    countdownEndDate: shortText,
    hideWhenExpired: z.boolean().catch(true),
    startDate: shortText,
    endDate: shortText,
  }),
  trendingConfig: productSectionSchema.extend({
    tabCategoryIds: idArray,
    defaultTabCategoryId: shortText,
  }),
  bestSellerConfig: productSectionSchema.extend({
    useOrderData: z.boolean().catch(true),
  }),
  newArrivalConfig: productSectionSchema,
  ageGroups: z
    .array(
      z.object({
        id: shortText,
        enabled: z.boolean().catch(true),
        sortOrder: z.coerce.number().int().min(0).max(999).catch(0),
        label: shortText,
        slug: shortText,
        minAge: z.coerce.number().int().min(0).max(240).catch(0),
        maxAge: z.coerce.number().int().min(0).max(240).catch(0),
        description: text,
        image: text,
        link: text,
        ageAttribute: shortText,
      }),
    )
    .catch([]),
  featuredBrandSelections: z
    .array(
      z.object({
        brandId: shortText,
        displayName: shortText,
        logoOverride: text,
        sortOrder: z.coerce.number().int().min(0).max(999).catch(0),
      }),
    )
    .catch([]),
  dealOfDay: z.object({
    enabled: z.boolean().catch(true),
    productId: shortText,
    variantId: shortText,
    title: shortText,
    description: text,
    endDate: shortText,
    ctaLabel: shortText,
    backgroundStyle: shortText,
    imageOverride: text,
  }),
  interestCollections: z
    .array(
      z.object({
        id: shortText,
        enabled: z.boolean().catch(true),
        sortOrder: z.coerce.number().int().min(0).max(999).catch(0),
        name: shortText,
        description: text,
        image: text,
        link: text,
        categoryId: shortText,
        tags: z.array(shortText).catch([]),
        productIds: idArray,
      }),
    )
    .catch([]),
  recommendedConfig: productSectionSchema,
  reviewsConfig: z.object({
    approvedOnly: z.boolean().catch(true),
    featuredOnly: z.boolean().catch(false),
    minimumRating: z.coerce.number().int().min(1).max(5).catch(4),
    maxItems: z.coerce.number().int().min(0).max(12).catch(3),
    reviewIds: idArray,
    showVerifiedBadge: z.boolean().catch(true),
    showProductLink: z.boolean().catch(true),
  }),
  blogConfig: z.object({
    mode: z.enum(["latest", "featured", "manual"]).catch("latest"),
    postIds: idArray,
    category: shortText,
    maxItems: z.coerce.number().int().min(0).max(12).catch(3),
    showExcerpt: z.boolean().catch(true),
    showReadingTime: z.boolean().catch(true),
    showCategory: z.boolean().catch(false),
  }),
  newsletterConfig: z.object({
    buttonLabel: shortText,
    privacyNote: text,
    image: text,
    successMessage: shortText,
  }),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function mergeDefaults<T extends Record<string, unknown>>(
  defaults: T,
  value: unknown,
): T {
  if (!isRecord(value)) return defaults;
  const merged: Record<string, unknown> = { ...defaults };
  for (const [key, defaultValue] of Object.entries(defaults)) {
    const incoming = value[key];
    merged[key] =
      isRecord(defaultValue) && isRecord(incoming)
        ? mergeDefaults(defaultValue, incoming)
        : (incoming ?? defaultValue);
  }
  return merged as T;
}

async function getSettingValue(key: string) {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row?.value;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const value = await getSettingValue("site");
  return mergeDefaults(defaultSiteSettings, value);
}

export async function getHomepageSettings(): Promise<HomepageSettings> {
  const value = await getSettingValue("homepage");
  return validateHomepageSettings(mergeDefaults(defaultHomepageSettings, value));
}

export async function saveSiteSettings(settings: SiteSettings) {
  return prisma.siteSetting.upsert({
    where: { key: "site" },
    create: {
      key: "site",
      value: settings as unknown as Prisma.InputJsonValue,
    },
    update: { value: settings as unknown as Prisma.InputJsonValue },
  });
}

export async function saveHomepageSettings(settings: HomepageSettings) {
  const value = validateHomepageSettings(settings);
  return prisma.siteSetting.upsert({
    where: { key: "homepage" },
    create: {
      key: "homepage",
      value: value as unknown as Prisma.InputJsonValue,
    },
    update: { value: value as unknown as Prisma.InputJsonValue },
  });
}

export function validateHomepageSettings(value: unknown): HomepageSettings {
  const settings = homepageSettingsSchema.parse(
    mergeDefaults(defaultHomepageSettings, value),
  );
  assertDateWindows(settings);
  return settings;
}

export function isWithinDateWindow(item: DateWindow, now = new Date()) {
  if (item.startDate && new Date(item.startDate) > now) return false;
  if (item.endDate && new Date(item.endDate) < now) return false;
  return true;
}

export function activeHomepageItems<T extends DateWindow & { enabled: boolean; sortOrder?: number }>(
  items: T[],
  now = new Date(),
) {
  return items
    .filter((item) => item.enabled && isWithinDateWindow(item, now))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function assertDateWindow(item: DateWindow, label: string) {
  if (!item.startDate || !item.endDate) return;
  if (new Date(item.startDate) <= new Date(item.endDate)) return;
  throw new Error(`${label} start date must be before end date.`);
}

function assertDateWindows(settings: HomepageSettings) {
  settings.announcementMessages.forEach((item) =>
    assertDateWindow(item, `Announcement ${item.id || item.message}`),
  );
  settings.heroSlides.forEach((item) =>
    assertDateWindow(item, `Hero slide ${item.id || item.title}`),
  );
  settings.sidePromoCards.forEach((item) =>
    assertDateWindow(item, `Promo card ${item.id || item.title}`),
  );
  assertDateWindow(settings.flashSaleConfig, "Flash sale");
}
