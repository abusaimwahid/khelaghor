import { ReturnStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { adjustInventory } from "@/server/inventory";
import { notifyUser } from "@/server/notify";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

async function updateReturnAction(formData: FormData) {
  "use server";
  const admin = await requirePermission("orders.update");
  const id = String(formData.get("returnId"));
  const status = String(formData.get("status")) as ReturnStatus;
  const request = await prisma.returnRequest.update({ where: { id }, data: { status }, include: { items: { include: { orderItem: true } } } });
  if (status === "PRODUCT_RECEIVED" || status === "REFUNDED") {
    for (const item of request.items) {
      await adjustInventory({ productId: item.orderItem.productId, variantId: item.orderItem.variantId, difference: item.quantity, reason: "Return restock", adminUserId: admin.id });
    }
  }
  await notifyUser({ userId: request.userId, type: "RETURN_UPDATED", title: "Return updated", body: `Status: ${status}` });
}

export default async function AdminReturnsPage() {
  await requirePermission("orders.view");
  const returns = await prisma.returnRequest.findMany({ include: { order: true, items: { include: { orderItem: true } } }, orderBy: { createdAt: "desc" } });
  return <section className="container py-10"><h1 className="mb-6 text-3xl font-black text-navy">Returns</h1><div className="space-y-4">{returns.map((ret) => <article key={ret.id} className="rounded-lg bg-white p-5 shadow-sm"><strong>{ret.order.number}</strong><p>{ret.reason} • {ret.status}</p><p className="text-sm text-slate-500">{ret.items.map((i) => `${i.quantity}× ${i.orderItem.name}`).join(", ")}</p><form action={updateReturnAction} className="mt-4 flex gap-2"><input type="hidden" name="returnId" value={ret.id} /><select name="status" className="rounded-md border p-2">{Object.values(ReturnStatus).map((s) => <option key={s}>{s}</option>)}</select><button className="rounded-md bg-coral px-4 font-bold text-white">Update</button></form></article>)}</div></section>;
}
