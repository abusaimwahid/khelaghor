import Link from "next/link";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { AdminStat } from "@/components/admin/admin-ui";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
import { productQualityWarnings } from "@/server/content-quality";
export const dynamic = "force-dynamic";
export default async function ContentQualityPage() {
  await requirePermission("products.view");
  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, archivedAt: null },
      include: { images: true, categories: true, variants: true },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    }),
    prisma.category.findMany({ where: { active: true, archivedAt: null } }),
    prisma.brand.findMany({ where: { active: true, archivedAt: null } }),
  ]);
  const rows = products.map((product) => ({
    product,
    warnings: productQualityWarnings(product),
  }));
  const categoryWarnings = categories
    .map((item) => ({
      item,
      warnings: [
        !item.nameBn && "Bangla name",
        !item.image && "image",
        !item.description && "description",
        !item.seoTitle && "SEO title",
        !item.seoDescription && "SEO description",
      ].filter(Boolean) as string[],
    }))
    .filter((row) => row.warnings.length);
  const brandWarnings = brands
    .map((item) => ({
      item,
      warnings: [
        !item.logo && "logo",
        !item.country && "country",
        !item.description && "description",
        !item.seoTitle && "SEO title",
        !item.seoDescription && "SEO description",
      ].filter(Boolean) as string[],
    }))
    .filter((row) => row.warnings.length);
  return (
    <AdminShell>
      <AdminHero
        title="Content Quality"
        description="Read-only launch checks for active products, categories and brands. Missing approved content remains visible as a warning, never fabricated."
        actions={
          <Link
            href="/admin/reports/content-quality/export"
            className="admin-button border bg-white text-navy"
          >
            Export CSV
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStat
          label="Products incomplete"
          value={rows.filter((row) => row.warnings.length).length}
        />
        <AdminStat
          label="Categories incomplete"
          value={categoryWarnings.length}
        />
        <AdminStat label="Brands incomplete" value={brandWarnings.length} />
      </div>
      <section className="kg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Warnings</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((row) => row.warnings.length)
                .map(({ product, warnings }) => (
                  <tr key={product.id} className="border-t">
                    <td className="font-bold text-navy">{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{warnings.join(", ")}</td>
                    <td>
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="font-bold text-coral"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
