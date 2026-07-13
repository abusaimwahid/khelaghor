import { toggleWishlistAction } from "@/app/actions/customer";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function AccountWishlistPage() {
  const user = await requireUser();
  const items = await prisma.wishlistItem.findMany({ where: { wishlist: { userId: user.id } }, include: { product: true } });
  return <section className="container py-10"><h1 className="mb-6 text-3xl font-black text-navy">Wishlist</h1><div className="space-y-3">{items.map((item) => <form key={item.productId} action={toggleWishlistAction} className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm"><input type="hidden" name="productId" value={item.productId} /><span>{item.product.name}</span><button className="font-bold text-coral">Remove</button></form>)}</div></section>;
}
