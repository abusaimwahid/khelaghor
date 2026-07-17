import { AdminHero, AdminShell } from "@/components/admin-shell";
import { CategoryForm } from "@/components/admin/category-form";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  await requirePermission("products.update");
  const categories = await prisma.category.findMany({
    where: { archivedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return (
    <AdminShell>
      <AdminHero
        title="New Category"
        description="Create a parent or child category with catalog, media and SEO fields."
      />
      <CategoryForm categories={categories} />
    </AdminShell>
  );
}
