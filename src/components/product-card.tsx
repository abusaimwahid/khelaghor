import Image from "next/image";
import Link from "next/link";
import { Heart, Layers3, ShoppingCart, Star } from "lucide-react";
import { addToCartAction } from "@/app/actions/cart";
import { money } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

export type CardProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  category: string;
  categoryName: string;
  price: number;
  salePrice: number | null;
  rating: number;
  reviews: number;
  stock: number;
  image: string;
  secondImage?: string | null;
  badges: string[];
  age: string;
  gender: string;
  description: string;
  variantCount?: number;
};

export function ProductCard({
  product,
  priority = false,
  compact = false,
}: {
  product: CardProduct;
  priority?: boolean;
  compact?: boolean;
}) {
  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;
  const unavailable = product.stock <= 0;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-[var(--border)] bg-white shadow-[0_8px_24px_rgba(16,38,74,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[1.05/1] overflow-hidden bg-gradient-to-br from-[#fffaf2] to-[#f4f8fb]"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={
            compact
              ? "(max-width: 640px) 44vw, 180px"
              : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          }
          preload={priority}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className="object-contain p-4 transition duration-500 group-hover:scale-[1.07]"
        />
        {product.secondImage ? (
          <Image
            src={product.secondImage}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-contain p-2 opacity-0 transition duration-200 group-hover:opacity-100"
          />
        ) : null}
        <div className="absolute left-2 top-2 flex max-w-[calc(100%-56px)] flex-wrap gap-1">
          {product.badges.slice(0, 2).map((badge) => (
            <StatusBadge key={badge}>{badge}</StatusBadge>
          ))}
          {discount > 0 ? <StatusBadge>{discount}% off</StatusBadge> : null}
        </div>
        <button
          type="button"
          className="focus-ring absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-navy shadow-md transition hover:bg-coral hover:text-white"
          aria-label="Add to wishlist"
        >
          <Heart className="h-4 w-4" />
        </button>
      </Link>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <p className="truncate text-xs font-black uppercase text-teal">
          {product.brand}
        </p>
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 min-h-11 text-[15px] font-black leading-[1.45] text-navy transition hover:text-coral"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-1 text-xs text-orange">
          <Star
            className={
              product.reviews ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5"
            }
          />
          {product.reviews ? (
            <>
              <span className="font-black">{product.rating.toFixed(1)}</span>
              <span className="text-slate-500">({product.reviews})</span>
            </>
          ) : (
            <span className="font-black text-slate-500">No reviews</span>
          )}
          {product.variantCount ? (
            <span className="ml-auto inline-flex items-center gap-1 text-slate-500">
              <Layers3 className="h-3.5 w-3.5" />
              {product.variantCount}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <strong className="text-xl tracking-tight text-navy">
            {money(product.salePrice ?? product.price)}
          </strong>
          {product.salePrice ? (
            <span className="text-xs font-bold text-slate-500 line-through">
              {money(product.price)}
            </span>
          ) : null}
        </div>
        <p
          className={
            unavailable
              ? "text-xs font-bold text-slate-500"
              : product.stock <= 5
                ? "text-xs font-bold text-orange"
                : "text-xs font-bold text-teal"
          }
        >
          {unavailable
            ? "Out of stock"
            : product.stock <= 5
              ? `Only ${product.stock} left`
              : "In stock"}
        </p>
        <form action={addToCartAction} className="mt-auto">
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="quantity" value="1" />
          <button
            className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-coral px-3 text-sm font-black text-white shadow-[0_8px_18px_rgba(255,92,117,.2)] transition hover:bg-[#f44765] disabled:bg-slate-300 disabled:shadow-none"
            disabled={unavailable}
          >
            <ShoppingCart className="h-4 w-4" />
            Quick Add
          </button>
        </form>
      </div>
    </article>
  );
}
