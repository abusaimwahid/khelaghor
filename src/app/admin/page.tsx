import Link from "next/link";
import { AlertTriangle, Boxes, ClipboardList, Headphones, PackageX, RotateCcw } from "lucide-react";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { AdminEmpty, AdminSection, AdminStat } from "@/components/admin/admin-ui";
import { StatusBadge } from "@/components/status-badge";
import { requirePermission } from "@/server/security";
import { prisma } from "@/server/db";
import { dhakaDate, money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requirePermission("reports.view");
  const [revenue, orderCount, pendingOrders, stockProducts, recentOrders, support, returns, refunds] = await Promise.all([
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PAYMENT_CONFIRMED", "PROCESSING"] } } }),
    prisma.product.findMany({ where: { archivedAt: null }, select: { stock: true, reservedStock: true, lowStockThreshold: true } }),
    prisma.order.findMany({ include: { address: true, items: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.supportTicket.count({ where: { status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    prisma.returnRequest.count({ where: { status: { in: ["REQUESTED", "UNDER_REVIEW", "PRODUCT_RECEIVED", "INSPECTING"] } } }),
    prisma.refund.count({ where: { status: { in: ["REQUESTED", "APPROVED", "PROCESSING"] } } }),
  ]);
  const lowStock = stockProducts.filter(product => product.stock - product.reservedStock > 0 && product.stock - product.reservedStock <= product.lowStockThreshold).length;
  const outOfStock = stockProducts.filter(product => product.stock - product.reservedStock <= 0).length;
  const alerts = [
    { label: "Orders requiring attention", count: pendingOrders, href: "/admin/orders?status=PENDING", icon: ClipboardList },
    { label: "Unresolved support tickets", count: support, href: "/admin/support", icon: Headphones },
    { label: "Returns awaiting action", count: returns, href: "/admin/returns", icon: RotateCcw },
    { label: "Pending refunds", count: refunds, href: "/admin/refunds", icon: AlertTriangle },
  ];
  return <AdminShell>
    <AdminHero title="Operations dashboard" description="A live, concise view of sales and queues that need staff attention." actions={<><Link href="/admin/orders" className="admin-button admin-button-secondary">View orders</Link><Link href="/admin/products/new" className="admin-button admin-button-primary">New product</Link></>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><AdminStat label="Paid revenue" value={money(Number(revenue._sum.total ?? 0))} detail="All paid orders" icon={Boxes} /><AdminStat label="All orders" value={orderCount} detail={`${pendingOrders} active queue`} icon={ClipboardList} /><AdminStat label="Low-stock products" value={lowStock} detail="Review thresholds" icon={AlertTriangle} /><AdminStat label="Out of stock" value={outOfStock} detail="Unavailable base products" icon={PackageX} /></div>
    <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <AdminSection title="Recent orders" description="Newest customer orders and current processing state" actions={<Link href="/admin/orders" className="admin-button admin-button-secondary">All orders</Link>}>
        <div className="table-wrap"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody>{recentOrders.map(order => <tr key={order.id} className="border-t border-[var(--border)]"><td><Link href={`/admin/orders/${order.id}`} className="font-black text-navy hover:text-coral">{order.number}</Link></td><td>{order.address?.name ?? order.phone ?? "Guest"}</td><td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td className="font-black text-navy">{money(Number(order.total))}</td><td><StatusBadge>{order.status}</StatusBadge></td><td>{dhakaDate(order.createdAt)}</td></tr>)}{!recentOrders.length ? <AdminEmpty colSpan={6} title="No recent orders" description="New orders will appear here as soon as they are placed." /> : null}</tbody></table></div>
      </AdminSection>
      <AdminSection title="Operational queues" description="Open work across trust and fulfilment workflows"><div className="divide-y divide-[var(--border)]">{alerts.map(({ label, count, href, icon: Icon }) => <Link key={label} href={href} className="flex items-center gap-3 p-4 transition hover:bg-slate-50"><span className={`grid h-10 w-10 place-items-center rounded-xl ${count ? "bg-orange-50 text-orange" : "bg-emerald-50 text-emerald-700"}`}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><strong className="text-sm text-navy">{label}</strong><p className="text-xs text-slate-500">{count ? "Action may be required" : "No open items"}</p></div><span className="text-xl font-black text-navy">{count}</span></Link>)}</div></AdminSection>
    </div>
    <AdminSection title="Quick actions" description="Common operational destinations"><div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">{[["Inventory", "/admin/inventory"], ["Content quality", "/admin/reports/content-quality"], ["Reconciliation", "/admin/reports/reconciliation"], ["Homepage CMS", "/admin/homepage"]].map(([label, href]) => <Link key={href} href={href} className="rounded-xl border border-[var(--border)] p-4 font-black text-navy transition hover:border-coral/30 hover:bg-slate-50">{label} <span aria-hidden="true" className="float-right text-coral">→</span></Link>)}</div></AdminSection>
  </AdminShell>;
}
