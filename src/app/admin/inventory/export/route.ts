import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export async function GET() {
  await requirePermission("products.update");
  const products = await prisma.product.findMany({
    where: { archivedAt: null },
    include: { inventory: true, variants: true, brand: true },
    orderBy: { name: "asc" },
  });
  const rows = [
    [
      "Product",
      "Variant",
      "SKU",
      "Brand",
      "Available",
      "Reserved",
      "Incoming",
      "Sold",
      "Returned",
      "Damaged",
      "Low stock threshold",
      "Status",
      "Updated",
    ],
  ];
  for (const product of products) {
    const available = product.inventory?.available ?? product.stock;
    const reserved = product.inventory?.reserved ?? product.reservedStock;
    rows.push([
      product.name,
      "Base",
      product.sku,
      product.brand?.name ?? "",
      String(available),
      String(reserved),
      String(product.inventory?.incoming ?? 0),
      String(product.inventory?.sold ?? 0),
      String(product.inventory?.returned ?? 0),
      String(product.inventory?.damaged ?? 0),
      String(product.lowStockThreshold),
      product.stockStatus,
      product.updatedAt.toISOString(),
    ]);
    for (const variant of product.variants) {
      rows.push([
        product.name,
        variant.name ?? "Variant",
        variant.sku,
        product.brand?.name ?? "",
        String(variant.stock),
        String(variant.reservedStock),
        "0",
        "0",
        "0",
        "0",
        String(variant.lowStockThreshold),
        variant.active ? "ACTIVE" : "INACTIVE",
        product.updatedAt.toISOString(),
      ]);
    }
  }
  const csv = rows
    .map((row) =>
      row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="inventory-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
