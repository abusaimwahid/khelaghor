import { AdminHero, AdminShell } from "@/components/admin-shell";
import { BrandForm } from "@/components/admin/brand-form";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function NewBrandPage() {
  await requirePermission("products.update");
  return (
    <AdminShell>
      <AdminHero
        title="New Brand"
        description="Create a brand with logo, country, metadata and SEO fields."
      />
      <BrandForm />
    </AdminShell>
  );
}
