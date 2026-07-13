import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
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
  badges: string[];
  age: string;
  gender: string;
  description: string;
};

export function ProductCard({ product, priority = false }: { product: CardProduct; priority?: boolean }) {
  const discount = product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;
  return (
    <article className="group overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square bg-cream">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          preload={priority}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className="object-cover transition group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {product.badges.slice(0, 2).map((badge) => (
            <StatusBadge key={badge}>{badge}</StatusBadge>
          ))}
          {discount > 0 ? <StatusBadge>{discount}% off</StatusBadge> : null}
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal">{product.brand}</p>
          <Link href={`/products/${product.slug}`} className="mt-1 line-clamp-2 min-h-11 font-extrabold text-navy hover:text-coral">
            {product.name}
          </Link>
        </div>
        <div className="flex items-center gap-1 text-sm text-orange">
          <Star className="h-4 w-4 fill-current" />
          <span className="font-bold">{product.rating.toFixed(1)}</span>
          <span className="text-muted-foreground text-slate-500">({product.reviews})</span>
        </div>
        <div className="flex items-end gap-2">
          <strong className="text-lg text-navy">{money(product.salePrice ?? product.price)}</strong>
          {product.salePrice ? <span className="text-sm text-slate-500 line-through">{money(product.price)}</span> : null}
        </div>
        <p className={product.stock > 0 ? "text-sm font-semibold text-teal" : "text-sm font-semibold text-slate-500"}>
          {product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
        </p>
        <div className="grid grid-cols-[40px_40px_1fr] gap-2">
          <button className="focus-ring grid h-10 place-items-center rounded-md border border-[var(--border)]" aria-label="Add to wishlist">
            <Heart className="h-4 w-4" />
          </button>
          <button className="focus-ring grid h-10 place-items-center rounded-md border border-[var(--border)]" aria-label="Quick view">
            <Eye className="h-4 w-4" />
          </button>
          <form action={addToCartAction}>
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="quantity" value="1" />
            <button className="focus-ring inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-coral px-3 text-sm font-extrabold text-white disabled:bg-slate-300" disabled={product.stock === 0}>
              <ShoppingCart className="h-4 w-4" />
              Add
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
