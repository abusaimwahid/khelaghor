import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
import { productQualityWarnings } from "@/server/content-quality";
export async function GET() {
  await requirePermission("products.view");
  const products = await prisma.product.findMany({
    where: { active: true, archivedAt: null },
    include: { images: true, categories: true, variants: true },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });
  const rows = [
    ["id", "sku", "name", "warnings"],
    ...products.map((product) => [
      product.id,
      product.sku,
      product.name,
      productQualityWarnings(product).join("; "),
    ]),
  ];
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        "attachment; filename=khelaghor-content-quality.csv",
      "Cache-Control": "no-store",
    },
  });
}
