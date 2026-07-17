import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { money } from "@/lib/utils";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function CouponDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("settings.update");
  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: {
      usages: { orderBy: { createdAt: "desc" }, take: 50 },
      products: { include: { product: { select: { name: true, sku: true } } } },
      categories: { include: { category: { select: { name: true } } } },
      brands: { include: { brand: { select: { name: true } } } },
      customers: { include: { user: { select: { email: true } } } },
    },
  });
  if (!coupon) notFound();
  return (
    <AdminShell>
      <AdminHero
        title={coupon.code}
        description="Coupon configuration, eligibility and recent successful usage."
      />
      <Link
        href={`/admin/coupons/${coupon.id}/edit`}
        className="inline-flex rounded-md bg-coral px-4 py-3 font-black text-white"
      >
        Edit coupon
      </Link>
      <section className="kg-card grid gap-4 p-6 md:grid-cols-3">
        <Line label="Type" value={coupon.type.replaceAll("_", " ")} />
        <Line
          label="Value"
          value={
            coupon.type === "FREE_DELIVERY"
              ? "Free delivery"
              : coupon.percentageValue
                ? `${Number(coupon.percentageValue)}%`
                : money(Number(coupon.fixedValue ?? coupon.value))
          }
        />
        <Line
          label="Active"
          value={coupon.active && !coupon.archivedAt ? "Yes" : "No"}
        />
        <Line
          label="Minimum"
          value={
            coupon.minimumEligibleSubtotal
              ? money(Number(coupon.minimumEligibleSubtotal))
              : "None"
          }
        />
        <Line
          label="Maximum"
          value={
            coupon.maximumDiscount
              ? money(Number(coupon.maximumDiscount))
              : "None"
          }
        />
        <Line
          label="Usage"
          value={`${coupon.usages.length}${coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}`}
        />
        <Line
          label="Products"
          value={
            coupon.products
              .map((row) => `${row.product.name} (${row.product.sku})`)
              .join(", ") || "Any"
          }
        />
        <Line
          label="Categories"
          value={
            coupon.categories.map((row) => row.category.name).join(", ") ||
            "Any"
          }
        />
        <Line
          label="Brands"
          value={coupon.brands.map((row) => row.brand.name).join(", ") || "Any"}
        />
        <Line
          label="Customers"
          value={
            coupon.customers.map((row) => row.user.email).join(", ") || "Any"
          }
        />
        <Line
          label="Payment methods"
          value={coupon.allowedPaymentMethods.join(", ") || "Any"}
        />
      </section>
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Recent Usage</h2>
        <div className="mt-4 space-y-2">
          {coupon.usages.map((usage) => (
            <p
              key={usage.id}
              className="rounded-md bg-cream p-3 text-sm font-semibold text-slate-700"
            >
              {usage.userId ?? "Guest"} • {usage.orderId ?? "No order"} •{" "}
              {usage.createdAt.toLocaleString("en-BD")}
            </p>
          ))}
          {!coupon.usages.length ? (
            <p className="text-sm font-semibold text-slate-500">
              No usage yet.
            </p>
          ) : null}
        </div>
      </section>
    </AdminShell>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="block text-xs font-black uppercase text-slate-500">
        {label}
      </span>
      <strong className="text-navy">{value}</strong>
    </p>
  );
}
