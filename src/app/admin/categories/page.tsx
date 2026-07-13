import { saveCategoryAction } from "@/app/actions/admin";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requirePermission("products.update");
  const categories = await prisma.category.findMany({ include: { parent: true, children: true }, orderBy: { name: "asc" } });
  return <section className="container grid gap-8 py-10 lg:grid-cols-[360px_1fr]"><form action={saveCategoryAction} className="rounded-lg bg-white p-6 shadow-sm"><h1 className="text-2xl font-black text-navy">Category</h1><input name="name" placeholder="Name" className="mt-4 w-full rounded-md border p-3" /><input name="slug" placeholder="slug" className="mt-4 w-full rounded-md border p-3" /><select name="parentId" className="mt-4 w-full rounded-md border p-3"><option value="">Top level</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button className="mt-4 rounded-md bg-coral px-5 py-3 font-black text-white">Save</button></form><div className="rounded-lg bg-white p-6 shadow-sm">{categories.map((c) => <p key={c.id} className="border-b py-3"><strong>{c.name}</strong> {c.parent ? `under ${c.parent.name}` : ""}</p>)}</div></section>;
}
