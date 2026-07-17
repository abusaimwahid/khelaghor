import Link from "next/link";
import { AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { AdminStat } from "@/components/admin/admin-ui";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReconciliationPage() {
  await requirePermission("reports.view");
  const [orders, inventories, duplicateTransactions, returns, stalePayments] =
    await Promise.all([
      prisma.order.findMany({
        include: {
          items: true,
          payments: { include: { transactions: true } },
          statusHistory: true,
          refunds: true,
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.inventory.findMany({ include: { product: true } }),
      prisma.payment.groupBy({
        by: ["reference"],
        where: { reference: { not: null } },
        _count: { reference: true },
        having: { reference: { _count: { gt: 1 } } },
      }),
      prisma.returnRequest.findMany({
        include: { items: true },
        where: {
          status: { in: ["REFUNDED", "REPLACEMENT_SENT", "CLOSED"] },
        },
        take: 500,
      }),
      prisma.$queryRaw<
        { orderId: string }[]
      >`SELECT "orderId" FROM "Payment" WHERE "status" = 'PENDING' AND "createdAt" < NOW() - INTERVAL '24 hours'`,
    ]);
  const stalePaymentOrderIds = new Set(
    stalePayments.map((payment) => payment.orderId),
  );

  const issues: {
    type: string;
    resource: string;
    detail: string;
    severity: "High" | "Review";
  }[] = [];
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
      issues.push({
        type: "Item subtotal mismatch",
        resource: order.number,
        detail: `Items ${money(itemSubtotal)} vs stored ${money(Number(order.subtotal))}`,
        severity: "High",
      });
    if (Math.abs(expectedTotal - Number(order.total)) > 0.01)
      issues.push({
        type: "Order total mismatch",
        resource: order.number,
        detail: `Expected ${money(expectedTotal)} vs stored ${money(Number(order.total))}`,
        severity: "High",
      });
    if (!order.statusHistory.length)
      issues.push({
        type: "Missing initial history",
        resource: order.number,
        detail: "No order status history exists",
        severity: "High",
      });
    const paid = order.payments
      .filter((payment) => payment.status === "PAID")
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    if (
      order.paymentStatus === "PAID" &&
      Math.abs(paid - Number(order.total)) > 0.01
    )
      issues.push({
        type: "Payment mismatch",
        resource: order.number,
        detail: `Verified payments ${money(paid)} vs total ${money(Number(order.total))}`,
        severity: "High",
      });
    for (const payment of order.payments.filter(
      (row) => row.provider === "SSLCOMMERZ",
    )) {
      const verifiedTransaction = payment.transactions.some(
        (transaction) => transaction.verified,
      );
      if (payment.status === "PAID" && order.paymentStatus !== "PAID")
        issues.push({
          type: "Paid gateway / unpaid order",
          resource: order.number,
          detail:
            "Gateway payment is paid while order payment status is not paid",
          severity: "High",
        });
      if (order.paymentStatus === "PAID" && !verifiedTransaction)
        issues.push({
          type: "Paid without verified transaction",
          resource: order.number,
          detail:
            "Order is paid without a verified SSLCommerz transaction record",
          severity: "High",
        });
      if (Math.abs(Number(payment.amount) - Number(order.total)) > 0.01)
        issues.push({
          type: "Gateway amount mismatch",
          resource: order.number,
          detail: `Payment ${money(Number(payment.amount))} vs order ${money(Number(order.total))}`,
          severity: "High",
        });
      if (payment.currency !== "BDT")
        issues.push({
          type: "Gateway currency mismatch",
          resource: order.number,
          detail: `Stored currency is ${payment.currency}`,
          severity: "High",
        });
      if (payment.callbackAt && !payment.ipnAt)
        issues.push({
          type: "Callback without IPN",
          resource: order.number,
          detail: "Callback recorded but IPN not yet recorded",
          severity: "Review",
        });
      if (payment.ipnAt && !payment.callbackAt)
        issues.push({
          type: "IPN without callback",
          resource: order.number,
          detail: "IPN recorded without callback timestamp",
          severity: "Review",
        });
      if (
        payment.validationStatus &&
        !["VALID", "VALIDATED", "SUCCESS"].includes(payment.validationStatus)
      )
        issues.push({
          type: "Failed gateway validation",
          resource: order.number,
          detail: `Validation status ${payment.validationStatus}`,
          severity: "High",
        });
      if (payment.status === "PENDING" && stalePaymentOrderIds.has(order.id))
        issues.push({
          type: "Stale pending payment",
          resource: order.number,
          detail: "Gateway payment has remained pending for more than 24 hours",
          severity: "Review",
        });
    }
    const refunded = order.refunds
      .filter(
        (refund) => refund.status !== "CANCELLED" && refund.status !== "FAILED",
      )
      .reduce((sum, refund) => sum + Number(refund.amount), 0);
    if (refunded > Number(order.total))
      issues.push({
        type: "Unsafe refund total",
        resource: order.number,
        detail: `${money(refunded)} exceeds ${money(Number(order.total))}`,
        severity: "High",
      });
  }
  for (const inventory of inventories)
    if (
      inventory.available < 0 ||
      inventory.reserved < 0 ||
      inventory.reserved > inventory.available
    )
      issues.push({
        type: "Inventory risk",
        resource: inventory.product.sku,
        detail: `Available ${inventory.available}, reserved ${inventory.reserved}`,
        severity: "High",
      });
  for (const duplicate of duplicateTransactions)
    issues.push({
      type: "Duplicate payment reference",
      resource: duplicate.reference ?? "missing",
      detail: `${duplicate._count.reference} payment records share this reference`,
      severity: "High",
    });
  for (const request of returns)
    for (const item of request.items)
      if (item.resellableQty + item.damagedQty < item.quantity)
        issues.push({
          type: "Incomplete return routing",
          resource: request.number,
          detail: `${item.quantity - item.resellableQty - item.damagedQty} unit(s) not routed`,
          severity: "Review",
        });

  return (
    <AdminShell>
      <AdminHero
        title="Commerce Reconciliation"
        description="Read-only checks for financial, payment, inventory, refund and return inconsistencies. Nothing is changed automatically."
        actions={
          <Link
            href="/admin/reports/reconciliation/export"
            className="admin-button border bg-white text-navy"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStat label="Orders checked" value={orders.length} />
        <AdminStat label="Inventory records" value={inventories.length} />
        <AdminStat label="Issues requiring review" value={issues.length} />
      </div>
      <section className="admin-section overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Check</th>
                <th>Resource</th>
                <th>Finding</th>
              </tr>
            </thead>
            <tbody>
              {issues.length ? (
                issues.map((issue, index) => (
                  <tr
                    key={`${issue.type}-${issue.resource}-${index}`}
                    className="border-t"
                  >
                    <td>
                      <span
                        className={
                          issue.severity === "High"
                            ? "text-coral"
                            : "text-orange"
                        }
                      >
                        <AlertTriangle className="mr-1 inline h-4 w-4" />
                        {issue.severity}
                      </span>
                    </td>
                    <td className="font-bold text-navy">{issue.type}</td>
                    <td className="font-mono text-xs">{issue.resource}</td>
                    <td>{issue.detail}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-teal">
                    <CheckCircle2 className="mx-auto mb-2 h-8 w-8" />
                    No issues detected by the current checks.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
