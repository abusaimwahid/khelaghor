import { AdminHero, AdminShell } from "@/components/admin-shell";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export default async function DevelopmentEmailsPage() {
  await requirePermission("settings.update");
  const env = getEnv();
  if (env.EMAIL_PROVIDER !== "dev" && env.EMAIL_PROVIDER !== "logger") {
    return (
      <AdminShell>
        <AdminHero
          title="Development Emails"
          description="Email logging is disabled for the configured provider."
        />
      </AdminShell>
    );
  }
  const logs = await prisma.developmentEmailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <AdminShell>
      <AdminHero
        title="Development Emails"
        description="Development or explicitly enabled staging email previews. No provider secrets are stored."
      />
      <section className="kg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase text-slate-500">
              <tr>
                {[
                  "Recipient",
                  "Subject",
                  "Template",
                  "Related",
                  "Timestamp",
                  "Preview",
                ].map((head) => (
                  <th key={head} className="p-3">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-t border-[var(--border)] align-top"
                >
                  <td className="p-3">{log.recipient}</td>
                  <td className="p-3">{log.subject}</td>
                  <td className="p-3">{log.template}</td>
                  <td className="p-3">
                    {[log.relatedType, log.relatedId]
                      .filter(Boolean)
                      .join(": ") || "-"}
                  </td>
                  <td className="p-3">
                    {log.createdAt.toLocaleString("en-BD")}
                  </td>
                  <td className="max-w-md whitespace-pre-wrap p-3 text-xs">
                    {log.preview.slice(0, 500)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
