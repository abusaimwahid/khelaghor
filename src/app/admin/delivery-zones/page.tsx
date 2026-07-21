import Link from "next/link";
import {
  archiveDeliveryZoneAction,
  deleteDeliveryZoneAction,
  duplicateDeliveryZoneAction,
  moveDeliveryZoneAction,
} from "@/app/actions/admin";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
import { money } from "@/lib/utils";
import { AdminAlert, AdminEmpty } from "@/components/admin/admin-ui";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function DeliveryZonesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; active?: string; page?: string; error?: string }>;
}) {
  await requirePermission("settings.update");
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const active = params?.active ?? "";
  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(active === "active" ? { active: true, archivedAt: null } : {}),
    ...(active === "inactive" ? { OR: [{ active: false }, { archivedAt: { not: null } }] } : {}),
  };
  const zones = await prisma.deliveryZone.findMany({
    where,
    include: { _count: { select: { rules: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 50,
  });
  return (
    <AdminShell>
      <AdminHero
        title="Delivery Zones"
        description="Database-backed Bangladesh delivery pricing, COD rules, express availability and deterministic rule matching."
      />
      {params?.error ? <AdminAlert>{params.error}</AdminAlert> : null}
      <div className="admin-section admin-toolbar">
        <form className="flex min-w-0 flex-1 gap-2">
          <input name="q" defaultValue={q} placeholder="Search zones" className="h-11 min-w-0 flex-1 rounded-md border px-3" />
          <select name="active" defaultValue={active} className="h-11 rounded-md border px-3">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive/archived</option>
          </select>
          <button className="admin-button bg-navy px-4 text-white">Filter</button>
        </form>
        <Link href="/admin/delivery-zones/new" className="admin-button admin-button-primary">New zone</Link>
      </div>
      <section className="kg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Zone</th>
                <th className="p-3">Base fee</th>
                <th className="p-3">Free threshold</th>
                <th className="p-3">Estimate</th>
                <th className="p-3">COD</th>
                <th className="p-3">Express</th>
                <th className="p-3">Rules</th>
                <th className="p-3">Sort</th>
                <th className="p-3">Updated</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id} className="border-t border-[var(--border)]">
                  <td className="p-3">
                    <Link href={`/admin/delivery-zones/${zone.id}/edit`} className="font-black text-navy">{zone.name}</Link>
                    <p className="text-xs text-slate-500">/{zone.slug}{zone.fallback ? " · fallback" : ""}{zone.pickup ? " · pickup" : ""}</p>
                    <StatusBadge className="mt-1">{zone.archivedAt ? "ARCHIVED" : zone.active ? "ACTIVE" : "INACTIVE"}</StatusBadge>
                  </td>
                  <td className="p-3">{money(Number(zone.deliveryFee))}</td>
                  <td className="p-3">{zone.freeDeliveryThreshold ? money(Number(zone.freeDeliveryThreshold)) : "None"}</td>
                  <td className="p-3">{zone.minDeliveryDays}-{zone.maxDeliveryDays} days</td>
                  <td className="p-3">{zone.codAvailable ? "Yes" : "No"}</td>
                  <td className="p-3">{zone.expressAvailable ? money(Number(zone.expressFee ?? zone.deliveryFee)) : "No"}</td>
                  <td className="p-3">{zone._count.rules}</td>
                  <td className="p-3">{zone.sortOrder}</td>
                  <td className="p-3">{zone.updatedAt.toLocaleDateString("en-BD")}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/delivery-zones/${zone.id}/edit`} className="admin-button admin-button-secondary">Edit</Link>
                      <form action={moveDeliveryZoneAction}><input type="hidden" name="zoneId" value={zone.id} /><input type="hidden" name="direction" value="up" /><button className="rounded-md border px-3 py-2 font-bold">Up</button></form>
                      <form action={moveDeliveryZoneAction}><input type="hidden" name="zoneId" value={zone.id} /><input type="hidden" name="direction" value="down" /><button className="rounded-md border px-3 py-2 font-bold">Down</button></form>
                      <form action={duplicateDeliveryZoneAction}><input type="hidden" name="zoneId" value={zone.id} /><button className="rounded-md border px-3 py-2 font-bold">Duplicate</button></form>
                      <form action={archiveDeliveryZoneAction}><input type="hidden" name="zoneId" value={zone.id} /><button className="rounded-md bg-slate-100 px-3 py-2 font-bold">Archive</button></form>
                      <form action={deleteDeliveryZoneAction}><input type="hidden" name="zoneId" value={zone.id} /><button className="admin-button admin-button-danger">Delete</button></form>
                    </div>
                  </td>
                </tr>
              ))}
              {!zones.length ? <AdminEmpty colSpan={10} title="No delivery zones found" description="Adjust the filters or create a zone and matching rules." /> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
