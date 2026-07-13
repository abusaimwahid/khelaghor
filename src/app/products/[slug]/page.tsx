import Image from "next/image";
import { notFound } from "next/navigation";
import { Heart, Share2, ShoppingCart, Star, Truck } from "lucide-react";
import { addToCartAction } from "@/app/actions/cart";
import { ProductGrid } from "@/components/sections";
import { StatusBadge } from "@/components/status-badge";
import { money } from "@/lib/utils";
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
    <div className="container py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <div className="grid gap-10 lg:grid-cols-2">
        <section className="grid gap-4 md:grid-cols-[96px_1fr]">
          <div className="hidden space-y-3 md:block">
            {product.images.slice(0, 4).map((image) => (
              <div
                key={image.id}
                className="relative aspect-square overflow-hidden rounded-md border border-[var(--border)] bg-white"
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <div className="relative aspect-square overflow-hidden rounded-lg bg-white shadow-sm">
            <Image
              src={card.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              preload
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {card.badges.map((badge) => (
              <StatusBadge key={badge}>{badge}</StatusBadge>
            ))}
          </div>
          <p className="font-black uppercase text-teal">
            {product.brand?.name ?? "KhelaGhor"} • SKU {product.sku}
          </p>
          <h1 className="text-3xl font-black text-navy md:text-5xl">
            {product.name}
          </h1>
          <div className="flex items-center gap-2 text-orange">
            <Star className="h-5 w-5 fill-current" />{" "}
            <strong>{card.rating.toFixed(1)}</strong>{" "}
            <span className="text-slate-500">({card.reviews} reviews)</span>
          </div>
          <div className="flex items-end gap-3">
            <strong className="text-3xl text-coral">
              {money(card.salePrice ?? card.price)}
            </strong>
            {card.salePrice ? (
              <span className="text-xl text-slate-500 line-through">
                {money(card.price)}
              </span>
            ) : null}
          </div>
          <p className="text-lg leading-8 text-slate-600">
            {product.fullDescription}
          </p>

          <form id="add-to-cart" action={addToCartAction} className="space-y-5">
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="quantity" value="1" />
            <div className="grid gap-4 rounded-lg bg-white p-5 shadow-sm sm:grid-cols-2">
              <label className="font-bold text-navy">
                Variant
                <select
                  name="variantId"
                  className="mt-2 w-full rounded-md border border-[var(--border)] p-3"
                >
                  <option value="">Default</option>
                  {product.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {[variant.colour, variant.size, variant.sku]
                        .filter(Boolean)
                        .join(" / ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="font-bold text-navy">
                Quantity
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  max="99"
                  defaultValue="1"
                  className="mt-2 w-full rounded-md border border-[var(--border)] p-3"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex h-12 items-center gap-2 rounded-md bg-coral px-6 font-black text-white"
                disabled={product.stock === 0}
              >
                <ShoppingCart /> Add to Cart
              </button>
              <button
                className="inline-flex h-12 items-center gap-2 rounded-md bg-navy px-6 font-black text-white"
                disabled={product.stock === 0}
              >
                Buy Now
              </button>
              <button
                type="button"
                className="grid h-12 w-12 place-items-center rounded-md border border-[var(--border)] bg-white"
              >
                <Heart />
              </button>
              <button
                type="button"
                className="grid h-12 w-12 place-items-center rounded-md border border-[var(--border)] bg-white"
              >
                <Share2 />
              </button>
            </div>
          </form>

          <div className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-black text-navy">
              <Truck /> Delivery
            </h2>
            <p className="text-slate-600">
              Select division, district and area at checkout. Standard delivery
              starts from ৳80 with COD availability.
            </p>
          </div>
        </section>
      </div>

      <section className="mt-10 rounded-lg bg-white p-6 shadow-sm">
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
      </section>

      <section className="mt-10 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-navy">Approved Reviews</h2>
        <div className="mt-4 space-y-3">
          {product.reviews.length ? (
            product.reviews.map((review) => (
              <div key={review.id} className="rounded-md bg-cream p-4">
                <strong>{review.rating}/5</strong>
                <p>{review.text}</p>
                {review.reply ? (
                  <p className="mt-2 text-sm text-teal">
                    Admin reply: {review.reply}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-slate-500">No approved reviews yet.</p>
          )}
        </div>
      </section>

      <ProductGrid
        title="Frequently Bought Together"
        items={related
          .map(productToCard)
          .filter((item) => item.id !== product.id)}
      />
    </div>
  );
}
