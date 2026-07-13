import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

async function saveBannerAction(formData: FormData) {
  "use server";
  await requirePermission("settings.update");
  await prisma.banner.create({
    data: {
      title: String(formData.get("title")),
      subtitle: String(formData.get("subtitle") || ""),
      image: String(formData.get("image") || ""),
      href: String(formData.get("href") || "/shop"),
      placement: String(formData.get("placement") || "home"),
    },
  });
}

export default async function AdminBannersPage() {
  await requirePermission("settings.update");
  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
  return <section className="container grid gap-8 py-10 lg:grid-cols-[360px_1fr]"><form action={saveBannerAction} className="rounded-lg bg-white p-6 shadow-sm"><h1 className="text-2xl font-black text-navy">Homepage Banner</h1>{["title", "subtitle", "image", "href", "placement"].map((n) => <input key={n} name={n} placeholder={n} className="mt-4 w-full rounded-md border p-3" />)}<button className="mt-4 rounded-md bg-coral px-5 py-3 font-black text-white">Save</button></form><div className="rounded-lg bg-white p-6 shadow-sm">{banners.map((b) => <p key={b.id} className="border-b py-3"><strong>{b.title}</strong> {b.placement}</p>)}</div></section>;
}
