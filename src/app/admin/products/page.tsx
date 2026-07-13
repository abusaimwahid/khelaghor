import { archiveProductAction, saveProductAction } from "@/app/actions/admin";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requirePermission("products.view");
  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({ include: { brand: true, categories: { include: { category: true } }, variants: true }, orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="container grid gap-8 py-10 lg:grid-cols-[420px_1fr]">
      <form action={saveProductAction} className="h-fit rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-navy">Create / Edit Product</h1>
        {["name", "slug", "sku", "shortDescription", "fullDescription", "seoTitle", "seoDescription", "imageUrl"].map((name) => <label key={name} className="mt-4 block font-bold text-navy">{name}<input name={name} className="mt-2 w-full rounded-md border border-[var(--border)] p-3" /></label>)}
        <label className="mt-4 block font-bold text-navy">Category<select name="categoryId" required className="mt-2 w-full rounded-md border border-[var(--border)] p-3">{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="mt-4 block font-bold text-navy">Brand<select name="brandId" className="mt-2 w-full rounded-md border border-[var(--border)] p-3"><option value="">No brand</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="mt-4 block font-bold text-navy">Price<input name="regularPrice" type="number" min="1" className="mt-2 w-full rounded-md border border-[var(--border)] p-3" /></label>
          <label className="mt-4 block font-bold text-navy">Sale<input name="salePrice" type="number" min="0" className="mt-2 w-full rounded-md border border-[var(--border)] p-3" /></label>
          <label className="mt-4 block font-bold text-navy">Stock<input name="stock" type="number" min="0" defaultValue="0" className="mt-2 w-full rounded-md border border-[var(--border)] p-3" /></label>
          <label className="mt-4 block font-bold text-navy">Status<select name="status" className="mt-2 w-full rounded-md border border-[var(--border)] p-3"><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label>
        </div>
        <h2 className="mt-6 font-black text-navy">Optional Variant</h2>
        <div className="grid grid-cols-2 gap-3">
          <input name="variantSku" placeholder="Variant SKU" className="mt-2 rounded-md border border-[var(--border)] p-3" />
          <input name="variantStock" type="number" placeholder="Stock" className="mt-2 rounded-md border border-[var(--border)] p-3" />
          <input name="variantSize" placeholder="Size" className="mt-2 rounded-md border border-[var(--border)] p-3" />
          <input name="variantColour" placeholder="Colour" className="mt-2 rounded-md border border-[var(--border)] p-3" />
        </div>
        <button className="mt-6 rounded-md bg-coral px-5 py-3 font-black text-white">Save product</button>
      </form>
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-navy">Products</h2>
        <div className="mt-5 space-y-3">
          {products.map((p) => (
            <div key={p.id} className="grid gap-3 rounded-md border border-[var(--border)] p-4 md:grid-cols-[1fr_120px_100px_100px]">
              <div><strong>{p.name}</strong><p className="text-sm text-slate-500">{p.sku} • {p.categories[0]?.category.name ?? "Unassigned"} • {p.variants.length} variants</p></div>
              <span>{money(Number(p.salePrice ?? p.regularPrice))}</span>
              <span>{p.status}</span>
              <form action={archiveProductAction}><input type="hidden" name="productId" value={p.id} /><button className="font-bold text-coral">Archive</button></form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
