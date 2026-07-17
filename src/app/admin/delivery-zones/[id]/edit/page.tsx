import { AdminHero, AdminShell } from "@/components/admin-shell";
import { DeliveryZoneForm } from "@/components/admin/delivery-zone-form";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
import { getDivisions } from "@/data/bangladesh-locations";

export const dynamic = "force-dynamic";

export default async function EditDeliveryZonePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  await requirePermission("settings.update");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const zone = await prisma.deliveryZone.findUniqueOrThrow({
    where: { id },
    include: { rules: { orderBy: [{ priority: "desc" }] } },
  });
  const divisions = getDivisions();
  return (
    <AdminShell>
      <AdminHero
        title={`Edit ${zone.name}`}
        description="Adjust delivery price, estimates, COD/express availability and location rules."
      />
      {query?.saved ? <p className="rounded-md bg-teal/10 p-3 text-sm font-bold text-teal">Delivery zone saved.</p> : null}
      {query?.error ? <p className="rounded-md bg-coral/10 p-3 text-sm font-bold text-coral">{query.error}</p> : null}
      <DeliveryZoneForm zone={zone} />
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Rule Summary</h2>
        <div className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
          {zone.rules.map((rule) => {
            const division = divisions.find((item) => item.id === rule.divisionId);
            const district = division?.districts.find((item) => item.id === rule.districtId);
            const area = district?.areas.find((item) => item.id === rule.areaId);
            return (
              <p key={rule.id}>
                {area?.name ?? district?.name ?? division?.name ?? (rule.remoteOnly ? "Remote areas" : "Fallback")} · priority {rule.priority}
              </p>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
}
