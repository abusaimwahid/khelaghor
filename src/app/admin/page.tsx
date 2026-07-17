import { AdminHero, AdminShell } from "@/components/admin-shell";
import { AdminStat } from "@/components/admin/admin-ui";
import { AdminTable } from "@/components/sections";
import { requirePermission } from "@/server/security";
import { prisma } from "@/server/db";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requirePermission("reports.view");
  const [products, categories, orders] = await Promise.all([
    prisma.product.findMany({
      include: { categories: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.category.findMany({
      include: { children: true },
      orderBy: { name: "asc" },
      take: 8,
    }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const stats = [
    ["Total revenue", money(revenue)],
    ["Recent orders", String(orders.length)],
    [
      "Pending orders",
      String(orders.filter((o) => o.status === "PENDING").length),
    ],
    [
      "Low stock",
      String(
        products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold)
          .length,
      ),
    ],
    ["Out of stock", String(products.filter((p) => p.stock === 0).length)],
    [
      "Average order value",
      orders.length ? money(Math.round(revenue / orders.length)) : money(0),
    ],
  ];
  return (
    <AdminShell>
      <AdminHero
        title="Operations Dashboard"
        description="Protected admin surface with RBAC-ready modules, live catalog/order data and production-oriented operational shortcuts."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([label, value]) => (
          <AdminStat
            key={label}
            label={label}
            value={value}
            detail="Live database snapshot"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminTable
          title="Product Management"
          rows={products.map((p) => [
            p.sku,
            p.name,
            p.categories[0]?.category.name ?? "Unassigned",
            p.stock ? "Published" : "Out of Stock",
          ])}
        />
        <AdminTable
          title="Category & Brand Management"
          rows={categories.map((c) => [
            c.name,
            c.slug,
            String(c.children.length),
            c.featured ? "Featured" : "Standard",
          ])}
        />
      </div>
      <AdminTable
        title="Order Operations"
        rows={orders.map((o) => [
          o.number,
          o.phone ?? "Guest",
          o.paymentMethod,
          `${o.status} • ${money(Number(o.total))}`,
        ])}
      />
    </AdminShell>
  );
}
