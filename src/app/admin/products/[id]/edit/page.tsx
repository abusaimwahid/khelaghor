import { notFound } from "next/navigation";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  await requirePermission("products.update");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        categories: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.category.findMany({
      where: { archivedAt: null },
      include: { parent: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();
  return (
    <AdminShell>
      <AdminHero
        title={`Edit ${product.name}`}
        description="Update product details, publish state, images, variants, inventory defaults and SEO from one professional workflow."
      />
      {query.error ? (
        <div className="rounded-md border border-coral bg-coral/10 p-3 font-bold text-coral">
          {query.error}
        </div>
      ) : null}
      {query.saved ? (
        <div className="rounded-md border border-teal bg-teal/10 p-3 font-bold text-teal">
          Product saved.
        </div>
      ) : null}
      <ProductForm
        mode="edit"
        product={product}
        categories={categories}
        brands={brands}
      />
    </AdminShell>
  );
}
