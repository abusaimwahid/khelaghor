import { saveBrandAction } from "@/app/actions/admin";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  await requirePermission("products.update");
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  return <section className="container grid gap-8 py-10 lg:grid-cols-[360px_1fr]"><form action={saveBrandAction} className="rounded-lg bg-white p-6 shadow-sm"><h1 className="text-2xl font-black text-navy">Brand</h1><input name="name" placeholder="Name" className="mt-4 w-full rounded-md border p-3" /><input name="slug" placeholder="slug" className="mt-4 w-full rounded-md border p-3" /><input name="logo" placeholder="Logo URL" className="mt-4 w-full rounded-md border p-3" /><button className="mt-4 rounded-md bg-coral px-5 py-3 font-black text-white">Save</button></form><div className="rounded-lg bg-white p-6 shadow-sm">{brands.map((b) => <p key={b.id} className="border-b py-3"><strong>{b.name}</strong> /{b.slug}</p>)}</div></section>;
}
