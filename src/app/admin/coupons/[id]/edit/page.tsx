import { notFound } from "next/navigation";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { CouponForm } from "@/components/admin/coupon-form";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("settings.update");
  const { id } = await params;
  const [coupon, products, categories, brands, customers] = await Promise.all([
    prisma.coupon.findUnique({
      where: { id },
      include: {
        products: true,
        categories: true,
        brands: true,
        customers: true,
      },
    }),
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
  if (!coupon) notFound();
  return (
    <AdminShell>
      <AdminHero
        title={`Edit ${coupon.code}`}
        description="Adjust coupon values, date windows, eligibility and usage limits."
      />
      <CouponForm
        coupon={coupon}
        products={products}
        categories={categories}
        brands={brands}
        customers={customers}
      />
    </AdminShell>
  );
}
