import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Heart,
  RotateCcw,
  Share2,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import { ProductGrid } from "@/components/sections";
import { StatusBadge } from "@/components/status-badge";
import { getProduct, listProducts, productToCard } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const card = productToCard(product);
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: product.reviews.filter((review) => review.rating === rating).length,
  }));
  const related = await listProducts({ categorySlug: card.category, take: 5 });
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    image: [card.image],
    description: product.fullDescription,
    brand: { "@type": "Brand", name: product.brand?.name ?? "KhelaGhor" },
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: String(card.salePrice ?? card.price),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${siteUrl}/products/${product.slug}`,
    },
    aggregateRating:
      card.reviews > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: card.rating.toFixed(1),
            reviewCount: card.reviews,
          }
        : undefined,
  };

  return (
    <div className="container storefront-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <nav className="storefront-breadcrumb mb-6">
        <Link href="/" className="hover:text-navy">
          Home
        </Link>
        <span className="px-2">/</span>
        <Link href="/shop" className="hover:text-navy">
          Shop
        </Link>
        <span className="px-2">/</span>
        <Link href={`/categories/${card.category}`} className="hover:text-navy">
          {card.categoryName}
        </Link>
        <span className="px-2">/</span>
        <span className="text-navy">{product.name}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] xl:gap-14">
        <section className="grid gap-4 md:grid-cols-[96px_1fr]">
          <div className="hidden space-y-3 md:block">
            {product.images.slice(0, 4).map((image) => (
              <div
                key={image.id}
                className="relative aspect-square overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm transition hover:border-coral"
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="96px"
                  className="object-contain p-1"
                />
              </div>
            ))}
          </div>
          <div className="group relative aspect-square overflow-hidden rounded-[24px] border border-[var(--border)] bg-gradient-to-br from-white to-[#f7fafc] shadow-[var(--shadow-soft)]">
            <Image
              src={card.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-8 transition duration-500 group-hover:scale-[1.04]"
              preload
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </section>

        <section className="space-y-5 lg:sticky lg:top-40 lg:self-start">
          <div className="flex flex-wrap gap-2">
            {card.badges.map((badge) => (
              <StatusBadge key={badge}>{badge}</StatusBadge>
            ))}
          </div>
          <p className="font-black uppercase text-teal">
            {product.brand?.name ?? "KhelaGhor"} • SKU {product.sku}
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-[-.035em] text-navy md:text-5xl">
            {product.name}
          </h1>
          <div className="flex items-center gap-2 text-orange">
            <Star
              className={card.reviews ? "h-5 w-5 fill-current" : "h-5 w-5"}
            />{" "}
            {card.reviews ? (
              <strong>{card.rating.toFixed(1)}</strong>
            ) : (
              <strong className="text-slate-500">No reviews yet</strong>
            )}{" "}
            <span className="text-slate-500">({card.reviews} reviews)</span>
          </div>
          <p className="text-lg leading-8 text-slate-600">
            {product.fullDescription}
          </p>

          <div className="flex flex-wrap gap-2">
            <button className="kg-button kg-button-secondary text-sm">
              <Heart className="h-4 w-4" /> Wishlist
            </button>
            <button className="kg-button kg-button-secondary text-sm">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>

          <ProductPurchasePanel
            productId={product.id}
            basePrice={card.price}
            baseSalePrice={card.salePrice}
            baseStock={card.stock}
            baseImage={card.image}
            variants={product.variants.map((variant) => ({
              id: variant.id,
              label:
                variant.name ||
                [variant.colour, variant.size, variant.material, variant.style]
                  .filter(Boolean)
                  .join(" / ") ||
                variant.sku,
              sku: variant.sku,
              stock: variant.stock,
              reservedStock: variant.reservedStock,
              active: variant.active && variant.status === "PUBLISHED",
              image: variant.image,
              price: variant.priceOverride
                ? Number(variant.priceOverride)
                : null,
              salePrice: variant.salePriceOverride
                ? Number(variant.salePriceOverride)
                : null,
            }))}
          />

          <div className="storefront-surface p-5">
            <h2 className="mb-3 flex items-center gap-2 font-black text-navy">
              <Truck /> Delivery
            </h2>
            <p className="text-slate-600">
              Select division, district and area at checkout. Standard delivery
              starts from ৳80 with COD availability.
            </p>
          </div>
          <div className="grid gap-3 rounded-[18px] bg-gradient-to-br from-[#f2fbf8] to-white p-5 text-sm font-bold text-navy sm:grid-cols-3">
            <span className="flex gap-2">
              <ShieldCheck className="h-5 w-5 text-teal" /> Safe curation
            </span>
            <span className="flex gap-2">
              <RotateCcw className="h-5 w-5 text-teal" /> Easy returns
            </span>
            <span className="flex gap-2">
              <ShieldCheck className="h-5 w-5 text-teal" /> Secure checkout
            </span>
          </div>
        </section>
      </div>

      <section className="storefront-surface mt-12 p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            "Description",
            "Specifications",
            "Size Guide",
            "Safety Information",
            "Delivery Information",
            "Reviews",
          ].map((tab) => (
            <button
              key={tab}
              className="rounded-md bg-cream px-4 py-3 font-bold text-navy"
            >
              {tab}
            </button>
          ))}
        </div>
        <p className="mt-6 leading-8 text-slate-600">
          {product.fullDescription}
        </p>
        {product.safetyInfo ? (
          <p className="mt-4 leading-8 text-slate-600">
            <strong className="text-navy">Safety:</strong> {product.safetyInfo}
          </p>
        ) : null}
        {product.careInstructions ? (
          <p className="mt-4 leading-8 text-slate-600">
            <strong className="text-navy">Care:</strong>{" "}
            {product.careInstructions}
          </p>
        ) : null}
      </section>

      <section className="storefront-surface mt-10 p-6 md:p-8">
        <h2 className="text-2xl font-black text-navy">Approved Reviews</h2>
        {product.reviews.length ? (
          <div className="mt-4 grid gap-2 rounded-md bg-cream p-4 text-sm font-bold text-navy md:grid-cols-5">
            {ratingDistribution.map((row) => (
              <p key={row.rating}>
                {row.rating} star: {row.count}
              </p>
            ))}
          </div>
        ) : null}
        <div className="mt-4 space-y-3">
          {product.reviews.length ? (
            product.reviews.map((review) => (
              <div key={review.id} className="rounded-md bg-cream p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <strong>{review.rating}/5</strong>
                  {review.verifiedPurchase ? (
                    <span className="rounded-full bg-teal px-2 py-1 text-xs font-black text-white">
                      Verified purchase
                    </span>
                  ) : null}
                  {review.featured ? (
                    <span className="rounded-full bg-sun px-2 py-1 text-xs font-black text-navy">
                      Featured
                    </span>
                  ) : null}
                </div>
                {review.title ? (
                  <h3 className="mt-2 font-black text-navy">{review.title}</h3>
                ) : null}
                <p className="mt-1 text-slate-700">{review.text}</p>
                {review.images.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {review.images.map((image) => (
                      <Image
                        key={image.id}
                        src={image.url}
                        alt=""
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-md object-cover"
                      />
                    ))}
                  </div>
                ) : null}
                {review.replies.map((reply) => (
                  <p
                    key={reply.id}
                    className="mt-2 rounded-md bg-white p-3 text-sm text-teal"
                  >
                    Admin reply: {reply.body}
                  </p>
                ))}
              </div>
            ))
          ) : (
            <p className="text-slate-500">
              No approved reviews yet. Ratings will appear after verified
              customer reviews are moderated.
            </p>
          )}
        </div>
      </section>

      <ProductGrid
        title="Frequently Bought Together"
        items={related
          .map(productToCard)
          .filter((item) => item.id !== product.id)}
      />
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-white p-3 md:hidden">
        <a
          href="#add-to-cart"
          className="grid h-11 place-items-center rounded-md bg-coral font-black text-white"
        >
          Add to cart
        </a>
      </div>
    </div>
  );
}
