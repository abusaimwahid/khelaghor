import { saveAddressAction } from "@/app/actions/customer";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return <section className="grid gap-6 lg:grid-cols-[360px_1fr]"><form action={saveAddressAction} className="storefront-surface rounded-[var(--radius-panel)] p-6"><p className="storefront-eyebrow">Delivery details</p><h2 className="mt-1 text-2xl font-black text-navy">Save address</h2>{["label", "name", "phone", "division", "district", "area", "postalCode", "line1", "landmark"].map((name) => <input key={name} name={name} placeholder={name} className="kg-input mt-3" />)}<button className="kg-button kg-button-primary mt-5">Save address</button></form><div className="storefront-surface rounded-[var(--radius-panel)] p-6"><h2 className="text-2xl font-black text-navy">Saved addresses</h2>{addresses.length ? <div className="mt-4 grid gap-3">{addresses.map((a) => <div key={a.id} className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-soft)] p-4"><strong className="text-navy">{a.label}</strong><p className="mt-1 text-sm text-slate-600">{a.line1}, {a.area}, {a.district}</p></div>)}</div> : <p className="mt-4 text-sm text-slate-500">No saved addresses yet.</p>}</div></section>;
}
