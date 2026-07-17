import type { DeliveryZone, DeliveryZoneRule } from "@prisma/client";
import { saveDeliveryZoneAction } from "@/app/actions/admin";
import { getDivisions } from "@/data/bangladesh-locations";

type ZoneWithRules = DeliveryZone & { rules: DeliveryZoneRule[] };

const blankRules: DeliveryZoneRule[] = Array.from({ length: 5 }).map((_, index) => ({
  id: `blank-${index}`,
  zoneId: "",
  divisionId: null,
  districtId: null,
  areaId: null,
  priority: index,
  remoteOnly: false,
}));

export function DeliveryZoneForm({ zone }: { zone?: ZoneWithRules | null }) {
  const divisions = getDivisions();
  const rules = [...(zone?.rules ?? []), ...blankRules].slice(0, 8);
  return (
    <form action={saveDeliveryZoneAction} className="space-y-5">
      <input name="zoneId" type="hidden" value={zone?.id ?? ""} />
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Zone Settings</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Name" name="name" value={zone?.name ?? ""} required />
          <Field label="Slug" name="slug" value={zone?.slug ?? ""} required />
          <Field label="Base delivery fee" name="deliveryFee" value={String(zone?.deliveryFee ?? 80)} type="number" />
          <Field label="Free delivery threshold" name="freeDeliveryThreshold" value={String(zone?.freeDeliveryThreshold ?? "")} type="number" />
          <Field label="Minimum days" name="minDeliveryDays" value={String(zone?.minDeliveryDays ?? 2)} type="number" />
          <Field label="Maximum days" name="maxDeliveryDays" value={String(zone?.maxDeliveryDays ?? 5)} type="number" />
          <Field label="Express fee" name="expressFee" value={String(zone?.expressFee ?? "")} type="number" />
          <Field label="Sort order" name="sortOrder" value={String(zone?.sortOrder ?? 0)} type="number" />
          <Field label="Description" name="description" value={zone?.description ?? ""} textarea wide />
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <Check label="Active" name="active" checked={zone?.active ?? true} />
          <Check label="COD available" name="codAvailable" checked={zone?.codAvailable ?? true} />
          <Check label="Express available" name="expressAvailable" checked={zone?.expressAvailable ?? false} />
          <Check label="Fallback zone" name="fallback" checked={zone?.fallback ?? false} />
          <Check label="Store pickup" name="pickup" checked={zone?.pickup ?? false} />
        </div>
      </section>
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Rules</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          More specific area rules beat district rules, which beat division rules. Higher priority wins within the same specificity.
        </p>
        <div className="mt-4 grid gap-3">
          {rules.map((rule, index) => (
            <div key={`${rule.id}-${index}`} className="grid gap-3 rounded-md bg-cream p-3 lg:grid-cols-[1fr_1fr_1fr_100px_120px]">
              <label>
                <span className="text-sm font-bold text-slate-600">Division</span>
                <select name="rule.divisionId" defaultValue={rule.divisionId ?? ""} className="mt-1 h-11 w-full rounded-md border px-3">
                  <option value="">None</option>
                  {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
                </select>
              </label>
              <label>
                <span className="text-sm font-bold text-slate-600">District</span>
                <select name="rule.districtId" defaultValue={rule.districtId ?? ""} className="mt-1 h-11 w-full rounded-md border px-3">
                  <option value="">Any district</option>
                  {divisions.flatMap((division) => division.districts.map((district) => <option key={district.id} value={district.id}>{division.name} / {district.name}</option>))}
                </select>
              </label>
              <label>
                <span className="text-sm font-bold text-slate-600">Area</span>
                <select name="rule.areaId" defaultValue={rule.areaId ?? ""} className="mt-1 h-11 w-full rounded-md border px-3">
                  <option value="">Any area</option>
                  {divisions.flatMap((division) => division.districts.flatMap((district) => district.areas.map((area) => <option key={area.id} value={area.id}>{district.name} / {area.name}</option>)))}
                </select>
              </label>
              <Field label="Priority" name="rule.priority" value={String(rule.priority)} type="number" />
              <label className="mt-7 inline-flex items-center gap-2 font-bold text-navy">
                <input name="rule.remoteOnly" type="checkbox" value={String(index)} defaultChecked={Boolean(rule.remoteOnly)} />
                Remote only
              </label>
            </div>
          ))}
        </div>
      </section>
      <button className="rounded-md bg-coral px-6 py-3 font-black text-white">
        Save delivery zone
      </button>
    </form>
  );
}

function Check({ label, name, checked }: { label: string; name: string; checked: boolean }) {
  return (
    <label className="inline-flex items-center gap-2 font-bold text-navy">
      <input name={name} type="checkbox" defaultChecked={checked} />
      {label}
    </label>
  );
}

function Field({
  label,
  name,
  value,
  type = "text",
  required = false,
  textarea = false,
  wide = false,
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "md:col-span-2" : ""}>
      <span className="text-sm font-bold text-slate-600">{label}</span>
      {textarea ? (
        <textarea name={name} defaultValue={value} rows={3} className="mt-1 w-full rounded-md border p-3" />
      ) : (
        <input name={name} type={type} required={required} defaultValue={value} className="mt-1 h-11 w-full rounded-md border p-3" />
      )}
    </label>
  );
}
