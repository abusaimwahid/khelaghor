import Link from "next/link";
import { notFound } from "next/navigation";
import { revokeStaffSessionsAction } from "@/app/actions/staff";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("staff.manage");
  const { id } = await params;
  const staff = await prisma.user.findUnique({
    where: { id },
    include: {
      roles: { include: { role: true } },
      permissionOverrides: { include: { permission: true } },
      sessions: true,
      auditLogs: { orderBy: { createdAt: "desc" }, take: 25 },
    },
  });
  if (!staff) notFound();
  return (
    <AdminShell>
      <AdminHero
        title={staff.name ?? "Staff account"}
        description={`${staff.email} • ${staff.roles.map((item) => item.role.name).join(", ")}`}
        actions={
          <Link
            href={`/admin/staff/${staff.id}/edit`}
            className="admin-button admin-button-primary"
          >
            Edit staff
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="kg-card p-5">
          <p className="text-xs font-black uppercase text-slate-500">Status</p>
          <strong className="mt-2 block text-xl text-navy">
            {staff.status}
          </strong>
        </div>
        <div className="kg-card p-5">
          <p className="text-xs font-black uppercase text-slate-500">
            Active sessions
          </p>
          <strong className="mt-2 block text-xl text-navy">
            {staff.sessions.length}
          </strong>
        </div>
        <div className="kg-card p-5">
          <p className="text-xs font-black uppercase text-slate-500">
            Password change
          </p>
          <strong className="mt-2 block text-xl text-navy">
            {staff.forcePasswordChange ? "Required" : "Complete"}
          </strong>
        </div>
      </div>
      <section className="kg-card p-6">
        <div className="flex justify-between">
          <h2 className="text-xl font-black text-navy">Sessions</h2>
          <form action={revokeStaffSessionsAction}>
            <input type="hidden" name="staffId" value={staff.id} />
            <button className="admin-button border text-coral">
              Revoke all
            </button>
          </form>
        </div>
        <div className="mt-4 space-y-2">
          {staff.sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm"
            >
              <span>
                Session created before {session.expires.toLocaleString("en-BD")}{" "}
                expiry
              </span>
              <form action={revokeStaffSessionsAction}>
                <input type="hidden" name="staffId" value={staff.id} />
                <input type="hidden" name="sessionId" value={session.id} />
                <button className="font-bold text-coral">Revoke</button>
              </form>
            </div>
          ))}
        </div>
      </section>
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Recent audit activity</h2>
        <div className="mt-4 space-y-2">
          {staff.auditLogs.map((log) => (
            <div
              key={log.id}
              className="grid gap-2 border-b py-3 text-sm md:grid-cols-[180px_1fr_1fr]"
            >
              <span>{log.createdAt.toLocaleString("en-BD")}</span>
              <strong>{log.action}</strong>
              <span>
                {log.entity} {log.entityId}
              </span>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
