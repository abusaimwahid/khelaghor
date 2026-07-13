import { ProductGrid } from "@/components/sections";
import { listCategories, listProducts, productToCard } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {};
  const category = typeof params.category === "string" ? params.category : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;
  const [categories, products] = await Promise.all([listCategories(), listProducts({ categorySlug: category, q })]);
  const cards = products.map(productToCard);
  return (
    <div className="container grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
      <aside className="h-fit rounded-lg bg-white p-5 shadow-sm">
        <h1 className="text-xl font-black text-navy">Filters</h1>
        {["Category", "Price", "Age Group", "Gender", "Brand", "Colour", "Size", "Rating", "Availability", "Discount", "Material"].map((filter) => (
          <details key={filter} className="border-b border-[var(--border)] py-4" open={filter === "Category"}>
            <summary className="cursor-pointer font-bold text-navy">{filter}</summary>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {(filter === "Category" ? categories.map((c) => c.name) : ["All", "Popular", "Featured"]).map((item) => (
                <label key={item} className="flex items-center gap-2"><input type="checkbox" /> {item}</label>
              ))}
            </div>
          </details>
        ))}
      </aside>
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-3xl font-black text-navy">Shop KhelaGhor</h1><p className="text-slate-600">{cards.length} products available</p></div>
          <select className="rounded-md border border-[var(--border)] bg-white px-4 py-3 font-bold">
            {["Most Popular", "Newest", "Price Low to High", "Price High to Low", "Best Rated", "Biggest Discount", "Best Selling"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <ProductGrid title="" items={cards} />
      </div>
    </div>
  );
}
