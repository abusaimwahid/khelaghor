import { notFound } from "next/navigation";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { StaffForm } from "@/components/admin/staff-form";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
export default async function EditStaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  await requirePermission("staff.manage");
  const { id } = await params;
  const query = await searchParams;
  const [staff, roles, permissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: { roles: true, permissionOverrides: true },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.permission.findMany({ orderBy: { key: "asc" } }),
  ]);
  if (!staff) notFound();
  return (
    <AdminShell>
      <AdminHero
        title={`Edit ${staff.name ?? "staff"}`}
        description="Role or security changes immediately revoke existing sessions."
      />
      {query?.error ? (
        <p className="rounded-lg bg-coral/10 p-3 font-bold text-coral">
          {query.error}
        </p>
      ) : null}
      <StaffForm staff={staff} roles={roles} permissions={permissions} />
    </AdminShell>
  );
}
