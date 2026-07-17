import Link from "next/link";
import { adjustInventoryAction } from "@/app/actions/admin";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { prisma } from "@/server/db";
import { inventoryMovementTypes } from "@/server/inventory";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

const pageSize = 25;

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    category?: string;
    brand?: string;
    page?: string;
  }>;
}) {
  await requirePermission("products.update");
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const page = Math.max(1, Number(params?.page ?? 1));
  const productWhere = {
    archivedAt: null,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
            { brand: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(params?.brand ? { brandId: params.brand } : {}),
    ...(params?.category
      ? { categories: { some: { categoryId: params.category } } }
      : {}),
  };
  const [products, total, categories, brands, movements] = await Promise.all([
    prisma.product.findMany({
      where: productWhere,
      include: {
        brand: true,
        categories: { include: { category: true } },
        inventory: true,
        variants: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where: productWhere }),
    prisma.category.findMany({
      where: { archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.brand.findMany({
      where: { active: true, archivedAt: null },
      orderBy: { name: "asc" },
    }),
    prisma.inventoryMovement.findMany({
      include: { inventory: { include: { product: true } }, variant: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  const filteredProducts = products.filter((product) => {
    const available = product.inventory?.available ?? product.stock;
    const reserved = product.inventory?.reserved ?? product.reservedStock;
    const sellable = available - reserved;
    if (params?.status === "in-stock")
      return sellable > product.lowStockThreshold;
    if (params?.status === "low-stock")
      return sellable > 0 && sellable <= product.lowStockThreshold;
    if (params?.status === "out-of-stock") return sellable <= 0;
    return true;
  });
  const summary = products.reduce(
    (acc, product) => {
      const available = product.inventory?.available ?? product.stock;
      const reserved = product.inventory?.reserved ?? product.reservedStock;
      const sellable = available - reserved;
      acc.available += available;
      acc.reserved += reserved;
      if (sellable <= 0) acc.out += 1;
      if (sellable > 0 && sellable <= product.lowStockThreshold) acc.low += 1;
      return acc;
    },
    { available: 0, reserved: 0, low: 0, out: 0 },
  );

  return (
    <AdminShell>
      <AdminHero
        title="Inventory Dashboard"
        description="Track available, reserved, incoming, sold, returned and damaged stock with transaction-safe adjustment history."
      />
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Available" value={summary.available} />
        <SummaryCard label="Reserved" value={summary.reserved} />
        <SummaryCard label="Low stock" value={summary.low} />
        <SummaryCard label="Out of stock" value={summary.out} />
      </div>
      <form className="kg-card grid gap-3 p-4 md:grid-cols-[1fr_180px_180px_180px_auto]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search product, SKU or brand"
          className="admin-input h-11"
        />
        <select
          name="status"
          defaultValue={params?.status ?? ""}
          className="h-11 rounded-md border px-3"
        >
          <option value="">All stock states</option>
          <option value="in-stock">In stock</option>
          <option value="low-stock">Low stock</option>
          <option value="out-of-stock">Out of stock</option>
        </select>
        <select
          name="category"
          defaultValue={params?.category ?? ""}
          className="h-11 rounded-md border px-3"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          name="brand"
          defaultValue={params?.brand ?? ""}
          className="h-11 rounded-md border px-3"
        >
          <option value="">All brands</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-navy px-4 font-black text-white">
          Filter
        </button>
      </form>
      <div className="flex justify-end">
        <Link
          href="/admin/inventory/export"
          className="rounded-md border border-[var(--border)] bg-white px-4 py-3 font-black text-navy"
        >
          Export CSV
        </Link>
      </div>
      <section className="kg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Variant</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Available</th>
                <th className="p-3">Reserved</th>
                <th className="p-3">Incoming</th>
                <th className="p-3">Sold</th>
                <th className="p-3">Returned</th>
                <th className="p-3">Damaged</th>
                <th className="p-3">Threshold</th>
                <th className="p-3">Status</th>
                <th className="p-3">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <InventoryRow key={product.id} product={product} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--border)] p-4 text-sm font-bold">
          Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
        </div>
      </section>
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Movement History</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Product</th>
                <th className="p-3">Type</th>
                <th className="p-3">Difference</th>
                <th className="p-3">Previous</th>
                <th className="p-3">New</th>
                <th className="p-3">Reserved</th>
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr
                  key={movement.id}
                  className="border-t border-[var(--border)]"
                >
                  <td className="p-3">
                    {movement.createdAt.toLocaleString("en-BD")}
                  </td>
                  <td className="p-3">{movement.inventory.product.name}</td>
                  <td className="p-3">{movement.movementType}</td>
                  <td className="p-3">{movement.difference}</td>
                  <td className="p-3">{movement.previousQuantity}</td>
                  <td className="p-3">{movement.newQuantity}</td>
                  <td className="p-3">
                    {movement.reservedBefore} → {movement.reservedAfter}
                  </td>
                  <td className="p-3">{movement.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}

function InventoryRow({
  product,
}: {
  product: Awaited<ReturnType<typeof prisma.product.findMany>>[number] & {
    inventory: Awaited<ReturnType<typeof prisma.inventory.findFirst>>;
    variants: {
      id: string;
      name: string | null;
      sku: string;
      stock: number;
      reservedStock: number;
      lowStockThreshold: number;
    }[];
  };
}) {
  const available = product.inventory?.available ?? product.stock;
  const reserved = product.inventory?.reserved ?? product.reservedStock;
  const sellable = available - reserved;
  const status =
    sellable <= 0
      ? "Out of stock"
      : sellable <= product.lowStockThreshold
        ? "Low stock"
        : "In stock";
  return (
    <>
      <tr className="border-t border-[var(--border)]">
        <td className="p-3 font-black text-navy">{product.name}</td>
        <td className="p-3">Base</td>
        <td className="p-3">{product.sku}</td>
        <td className="p-3">{available}</td>
        <td className="p-3">{reserved}</td>
        <td className="p-3">{product.inventory?.incoming ?? 0}</td>
        <td className="p-3">{product.inventory?.sold ?? 0}</td>
        <td className="p-3">{product.inventory?.returned ?? 0}</td>
        <td className="p-3">{product.inventory?.damaged ?? 0}</td>
        <td className="p-3">{product.lowStockThreshold}</td>
        <td className="p-3">{status}</td>
        <td className="p-3">
          <AdjustmentForm productId={product.id} />
        </td>
      </tr>
      {product.variants.map((variant) => (
        <tr
          key={variant.id}
          className="border-t border-[var(--border)] bg-slate-50/50"
        >
          <td className="p-3 pl-8">{product.name}</td>
          <td className="p-3">{variant.name || "Variant"}</td>
          <td className="p-3">{variant.sku}</td>
          <td className="p-3">{variant.stock}</td>
          <td className="p-3">{variant.reservedStock}</td>
          <td className="p-3">0</td>
          <td className="p-3">0</td>
          <td className="p-3">0</td>
          <td className="p-3">0</td>
          <td className="p-3">{variant.lowStockThreshold}</td>
          <td className="p-3">
            {variant.stock - variant.reservedStock <= 0
              ? "Out of stock"
              : "In stock"}
          </td>
          <td className="p-3">
            <AdjustmentForm productId={product.id} variantId={variant.id} />
          </td>
        </tr>
      ))}
    </>
  );
}

function AdjustmentForm({
  productId,
  variantId,
}: {
  productId: string;
  variantId?: string;
}) {
  return (
    <form action={adjustInventoryAction} className="grid min-w-80 gap-2">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={variantId ?? ""} />
      <div className="grid grid-cols-2 gap-2">
        <select name="movementType" className="h-10 rounded-md border px-2">
          {inventoryMovementTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          name="difference"
          type="number"
          placeholder="+/- qty"
          className="h-10 rounded-md border px-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="reservedDifference"
          type="number"
          placeholder="Reserved +/-"
          className="h-10 rounded-md border px-2"
        />
        <input
          name="reference"
          placeholder="Reference"
          className="h-10 rounded-md border px-2"
        />
      </div>
      <input
        name="reason"
        placeholder="Reason"
        className="h-10 rounded-md border px-2"
      />
      <input
        name="notes"
        placeholder="Internal note"
        className="h-10 rounded-md border px-2"
      />
      <button className="rounded-md bg-navy px-3 py-2 font-bold text-white">
        Apply
      </button>
    </form>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="kg-card p-4">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-navy">{value}</p>
    </div>
  );
}
