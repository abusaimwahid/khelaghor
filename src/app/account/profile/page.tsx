import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";

export const dynamic = "force-dynamic";

async function updateProfile(formData: FormData) {
  "use server";
  const user = await requireUser();
  await prisma.user.update({ where: { id: user.id }, data: { name: String(formData.get("name") || ""), phone: String(formData.get("phone") || "") } });
}

export default async function ProfilePage() {
  const user = await requireUser();
  return <section className="storefront-surface rounded-[var(--radius-panel)] p-6 md:p-8"><p className="storefront-eyebrow">Personal details</p><h2 className="mt-1 text-2xl font-black text-navy">Profile</h2><form action={updateProfile} className="mt-6 grid max-w-xl gap-5"><label className="font-bold text-navy">Name<input name="name" defaultValue={user.name ?? ""} className="kg-input mt-2" /></label><label className="font-bold text-navy">Phone<input name="phone" defaultValue={user.phone ?? ""} className="kg-input mt-2" /></label><p className="text-sm text-slate-500">Email: {user.email}</p><button className="kg-button kg-button-primary w-fit">Save changes</button></form></section>;
}
