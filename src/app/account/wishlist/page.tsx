import { toggleWishlistAction } from "@/app/actions/customer";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";
import { productInclude, productToCard } from "@/server/catalog";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/states";
import { X } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountWishlistPage() {
  const user = await requireUser();
  const items = await prisma.wishlistItem.findMany({ where: { wishlist: { userId: user.id } }, include: { product: { include: productInclude } } });
  return <section className="space-y-5 pb-10"><header className="kg-card p-5 sm:p-7"><p className="storefront-eyebrow">Saved for later</p><div className="mt-1 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-black text-navy">Wishlist</h1><p className="mt-2 text-sm text-slate-600">Your favourite products, ready when you are.</p></div><span className="rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm font-black text-navy">{items.length} {items.length === 1 ? "item" : "items"}</span></div></header>{items.length ? <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">{items.map((item) => <div key={item.productId} className="relative"><ProductCard product={productToCard(item.product)} compact /><form action={toggleWishlistAction} className="absolute right-2 top-2 z-10"><input type="hidden" name="productId" value={item.productId} /><button aria-label={`Remove ${item.product.name} from wishlist`} className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-white text-coral shadow-md transition hover:bg-coral hover:text-white"><X className="h-4 w-4" /></button></form></div>)}</div> : <EmptyState title="Your wishlist is empty" description="Save products you love and come back to them whenever you are ready." href="/shop" action="Explore products" />}</section>;
}
