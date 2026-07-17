import { NextResponse } from "next/server";
import { ProductStatus, Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await requirePermission("products.view");
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);
  const products = await prisma.product.findMany({
    where: buildWhere(params),
    include: {
      brand: true,
      categories: { include: { category: true } },
      inventory: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });
  const rows = [
    [
      "Name",
      "SKU",
      "Barcode",
      "Category",
      "Brand",
      "Regular Price",
      "Sale Price",
      "Available",
      "Reserved",
      "Status",
      "Featured",
      "New Arrival",
      "Best Seller",
      "Created",
      "Updated",
    ],
    ...products.map((product) => [
      product.name,
      product.sku,
      product.barcode ?? "",
      product.categories.map((item) => item.category.name).join(" | "),
      product.brand?.name ?? "",
      String(product.regularPrice),
      product.salePrice ? String(product.salePrice) : "",
      String(
        (product.inventory?.available ?? product.stock) - product.reservedStock,
      ),
      String(product.reservedStock),
      product.status,
      product.featured ? "yes" : "no",
      product.newArrival ? "yes" : "no",
      product.bestSeller ? "yes" : "no",
      product.createdAt.toISOString(),
      product.updatedAt.toISOString(),
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="khelaghor-products.csv"`,
    },
  });
}

function buildWhere(params: Record<string, string>): Prisma.ProductWhereInput {
  return {
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" } },
            { sku: { contains: params.q, mode: "insensitive" } },
            { barcode: { contains: params.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(params.category
      ? { categories: { some: { categoryId: params.category } } }
      : {}),
    ...(params.brand ? { brandId: params.brand } : {}),
    ...(params.status
      ? { status: params.status as ProductStatus }
      : { archivedAt: null }),
    ...(params.featured === "true"
      ? { featured: true }
      : params.featured === "false"
        ? { featured: false }
        : {}),
  };
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
