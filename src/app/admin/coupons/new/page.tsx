import { AdminHero, AdminShell } from "@/components/admin-shell";
import { CouponForm } from "@/components/admin/coupon-form";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function NewCouponPage() {
  await requirePermission("settings.update");
  const [products, categories, brands, customers] = await lookupData();
  return (
    <AdminShell>
      <AdminHero
        title="New Coupon"
        description="Create a checkout coupon with server-enforced eligibility and limits."
      />
      <CouponForm
        products={products}
        categories={categories}
        brands={brands}
        customers={customers}
      />
    </AdminShell>
  );
}

async function lookupData() {
  return Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED", archivedAt: null },
      select: { id: true, name: true, sku: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.category.findMany({
      where: { active: true, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.brand.findMany({
      where: { active: true, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, email: true, name: true },
      orderBy: { email: "asc" },
      take: 200,
    }),
  ]);
}
