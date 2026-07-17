import { AdminHero, AdminShell } from "@/components/admin-shell";
import { DeliveryZoneForm } from "@/components/admin/delivery-zone-form";
import { requirePermission } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function NewDeliveryZonePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  await requirePermission("settings.update");
  const params = await searchParams;
  return (
    <AdminShell>
      <AdminHero
        title="New Delivery Zone"
        description="Create a zone with fee, estimate, COD/express settings and Bangladesh location rules."
      />
      {params?.error ? <p className="rounded-md bg-coral/10 p-3 text-sm font-bold text-coral">{params.error}</p> : null}
      <DeliveryZoneForm />
    </AdminShell>
  );
}
