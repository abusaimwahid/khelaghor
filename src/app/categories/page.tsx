import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { listCategories } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategories();
  return (
    <section className="container py-12">
      <h1 className="mb-8 text-4xl font-black text-navy">Categories</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/categories/${category.slug}`} className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <PackageSearch className="mb-4 h-8 w-8 text-coral" />
            <strong className="text-lg text-navy">{category.name}</strong>
            <p className="mt-2 text-sm text-slate-500">{category.children.map((child) => child.name).join(" • ")}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
