import { ProductGrid, SectionHeader } from "@/components/sections";
import { listProducts, productToCard } from "@/server/catalog";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug: slug.at(-1) ?? slug[0] } });
  const filtered = await listProducts({ categorySlug: category?.slug ?? slug[0] });
  const cards = filtered.map(productToCard);
  return (
    <div className="py-10">
      <section className="container rounded-lg bg-white p-8 shadow-sm">
        <SectionHeader title={category?.name ?? "Category"} eyebrow={slug.join(" / ")} />
        <p className="text-slate-600">Browse safe, high-quality {category?.name.toLowerCase() ?? "children’s products"} with shareable filters and fast Bangladesh delivery.</p>
      </section>
      <ProductGrid title="Products" items={cards} />
    </div>
  );
}
