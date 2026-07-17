import Link from "next/link";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";
const take = 25;
export default async function StaffPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
}) {
  await requirePermission("staff.manage");
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page ?? 1));
  const where = {
    roles: { some: {} },
    ...(params?.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" as const } },
            { email: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(params?.role ? { roles: { some: { roleId: params.role } } } : {}),
    ...(params?.status
      ? { status: params.status as "ACTIVE" | "BLOCKED" | "ARCHIVED" }
      : {}),
  };
  const [staff, count, roles] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        roles: { include: { role: true } },
        sessions: { select: { id: true } },
        auditLogs: {
          where: { action: { in: ["login", "login.failed"] } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    prisma.user.count({ where }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <AdminShell>
      <AdminHero
        title="Staff Management"
        description="Manage staff roles, account state, security resets and sessions with final-Super-Admin guardrails."
        actions={
          <Link
            href="/admin/staff/new"
            className="admin-button admin-button-primary"
          >
            New staff
          </Link>
        }
      />
      <form className="kg-card grid gap-3 p-4 md:grid-cols-[1fr_200px_180px_auto]">
        <input
          name="q"
          defaultValue={params?.q ?? ""}
          placeholder="Search name or email"
          className="admin-input h-11"
        />
        <select
          name="role"
          defaultValue={params?.role ?? ""}
          className="kg-input"
        >
          <option value="">All roles</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={params?.status ?? ""}
          className="kg-input"
        >
          <option value="">All states</option>
          <option>ACTIVE</option>
          <option>BLOCKED</option>
          <option>ARCHIVED</option>
        </select>
        <button className="admin-button bg-navy text-white">Filter</button>
      </form>
      <section className="kg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Password reset</th>
                <th>Last login</th>
                <th>Last failed login</th>
                <th>Sessions</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => {
                const lastLogin = person.auditLogs.find(
                  (log) => log.action === "login",
                );
                const lastFailed = person.auditLogs.find(
                  (log) => log.action === "login.failed",
                );
                return (
                  <tr key={person.id} className="border-t">
                    <td>
                      <strong className="text-navy">
                        {person.name ?? "Unnamed"}
                      </strong>
                      <p className="text-xs text-slate-500">{person.email}</p>
                    </td>
                    <td>
                      {person.roles.map((item) => item.role.name).join(", ")}
                    </td>
                    <td>{person.status}</td>
                    <td>{person.forcePasswordChange ? "Required" : "No"}</td>
                    <td>
                      {lastLogin?.createdAt.toLocaleString("en-BD") ?? "Never"}
                    </td>
                    <td>
                      {lastFailed?.createdAt.toLocaleString("en-BD") ?? "None"}
                    </td>
                    <td>{person.sessions.length}</td>
                    <td>{person.createdAt.toLocaleDateString("en-BD")}</td>
                    <td>{person.updatedAt.toLocaleDateString("en-BD")}</td>
                    <td>
                      <Link
                        href={`/admin/staff/${person.id}`}
                        className="admin-button border text-navy"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t p-4 text-sm font-bold">
          {count} staff • Page {page} of {Math.max(1, Math.ceil(count / take))}
        </div>
      </section>
    </AdminShell>
  );
}
