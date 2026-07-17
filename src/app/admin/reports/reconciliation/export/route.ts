import { requirePermission } from "@/server/security";
import { prisma } from "@/server/db";

export async function GET() {
  await requirePermission("reports.view");
  const orders = await prisma.order.findMany({
    include: { items: true, statusHistory: true, payments: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  const rows = [["type", "resource", "detail"]];
  for (const order of orders) {
    const itemSubtotal = order.items.reduce(
      (sum, item) =>
        sum + Number(item.unitPrice) * item.quantity - Number(item.discount),
      0,
    );
    const expectedTotal =
      Number(order.subtotal) -
      Number(order.discount) +
      Number(order.deliveryFee);
    if (Math.abs(itemSubtotal - Number(order.subtotal)) > 0.01)
      rows.push([
        "item_subtotal_mismatch",
        order.number,
        `items=${itemSubtotal};stored=${order.subtotal}`,
      ]);
    if (Math.abs(expectedTotal - Number(order.total)) > 0.01)
      rows.push([
        "order_total_mismatch",
        order.number,
        `expected=${expectedTotal};stored=${order.total}`,
      ]);
    if (!order.statusHistory.length)
      rows.push(["missing_history", order.number, "No status history"]);
    const paid = order.payments
      .filter((payment) => payment.status === "PAID")
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    if (
      order.paymentStatus === "PAID" &&
      Math.abs(paid - Number(order.total)) > 0.01
    )
      rows.push([
        "payment_mismatch",
        order.number,
        `paid=${paid};total=${order.total}`,
      ]);
  }
  const body = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        "attachment; filename=khelaghor-reconciliation-notice.csv",
      "Cache-Control": "no-store",
    },
  });
}
