import { saveAddressAction } from "@/app/actions/customer";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return <section className="container grid gap-8 py-10 lg:grid-cols-[360px_1fr]"><form action={saveAddressAction} className="rounded-lg bg-white p-6 shadow-sm"><h1 className="text-2xl font-black text-navy">Save Address</h1>{["label", "name", "phone", "division", "district", "area", "postalCode", "line1", "landmark"].map((name) => <input key={name} name={name} placeholder={name} className="mt-4 w-full rounded-md border border-[var(--border)] p-3" />)}<button className="mt-4 rounded-md bg-coral px-5 py-3 font-black text-white">Save</button></form><div className="rounded-lg bg-white p-6 shadow-sm">{addresses.map((a) => <div key={a.id} className="border-b py-4"><strong>{a.label}</strong><p>{a.line1}, {a.area}, {a.district}</p></div>)}</div></section>;
}
