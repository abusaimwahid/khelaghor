import { AdminHero, AdminShell } from "@/components/admin-shell";
import { StaffForm } from "@/components/admin/staff-form";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
export default async function NewStaffPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  await requirePermission("staff.manage");
  const params = await searchParams;
  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.permission.findMany({ orderBy: { key: "asc" } }),
  ]);
  return (
    <AdminShell>
      <AdminHero
        title="Create Staff"
        description="Create a staff account with a temporary password, one operational role and explicit overrides."
      />
      {params?.error ? (
        <p className="rounded-lg bg-coral/10 p-3 font-bold text-coral">
          {params.error}
        </p>
      ) : null}
      <StaffForm roles={roles} permissions={permissions} />
    </AdminShell>
  );
}
