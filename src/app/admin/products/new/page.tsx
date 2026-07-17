import { AdminHero, AdminShell } from "@/components/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requirePermission("products.create");
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: { archivedAt: null },
      include: { parent: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <AdminShell>
      <AdminHero
        title="New Product"
        description="Create a full catalog product with content, pricing, inventory, images, variants, publishing and SEO."
      />
      <ProductForm mode="create" categories={categories} brands={brands} />
    </AdminShell>
  );
}
