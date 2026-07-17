import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export async function GET() {
  await requirePermission("orders.view");
  const orders = await prisma.order.findMany({
    include: { address: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
  const rows = [
    [
      "Order number",
      "Customer",
      "Phone",
      "Email",
      "Date",
      "Item count",
      "Total",
      "Payment method",
      "Payment status",
      "Order status",
      "Delivery method",
      "Courier",
      "Tracking number",
    ],
    ...orders.map((order) => [
      order.number,
      order.address?.name ?? "",
      order.phone ?? "",
      order.email ?? "",
      order.createdAt.toISOString(),
      String(order.items.reduce((sum, item) => sum + item.quantity, 0)),
      String(order.total),
      order.paymentMethod,
      order.paymentStatus,
      order.status,
      order.deliveryMethod,
      order.courierProvider ?? "",
      order.trackingId ?? "",
    ]),
  ];
  const csv = rows
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
