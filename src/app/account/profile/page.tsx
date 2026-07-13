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
  return <section className="container py-10"><form action={updateProfile} className="max-w-xl rounded-lg bg-white p-6 shadow-sm"><h1 className="text-3xl font-black text-navy">Profile</h1><input name="name" defaultValue={user.name ?? ""} className="mt-4 w-full rounded-md border p-3" /><input name="phone" defaultValue={user.phone ?? ""} className="mt-4 w-full rounded-md border p-3" /><button className="mt-4 rounded-md bg-coral px-5 py-3 font-black text-white">Save</button></form></section>;
}
