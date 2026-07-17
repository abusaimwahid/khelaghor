import { AdminHero, AdminShell } from "@/components/admin-shell";
import { saveSiteSettingsAction } from "@/app/actions/admin";
import { requirePermission } from "@/server/security";
import { getSiteSettings } from "@/server/site-settings";
import { CmsImageField } from "@/components/admin/cms-image-field";

export const dynamic = "force-dynamic";

const groups = [
  {
    key: "general",
    title: "General Settings",
    fields: [
      ["storeName", "Store name"],
      ["storeNameBn", "Store name (বাংলা)"],
      ["tagline", "Tagline"],
      ["taglineBn", "Tagline (বাংলা)"],
      ["businessDescription", "Business description", "textarea"],
      ["businessDescriptionBn", "Business description (বাংলা)", "textarea"],
      ["supportEmail", "Support email"],
      ["supportPhone", "Support phone"],
      ["whatsappNumber", "WhatsApp number"],
      ["address", "Address", "textarea"],
      ["businessHours", "Business hours"],
      ["currency", "Currency"],
      ["timezone", "Timezone"],
      ["defaultLanguage", "Default language"],
    ],
  },
  {
    key: "branding",
    title: "Branding",
    fields: [
      ["mainLogo", "Main logo", "upload"],
      ["compactLogo", "Compact logo", "upload"],
      ["darkLogo", "Dark logo", "upload"],
      ["lightLogo", "Light logo", "upload"],
      ["favicon", "Favicon", "upload"],
      ["primaryColour", "Primary colour", "color"],
      ["secondaryColour", "Secondary colour", "color"],
      ["accentColour", "Accent colour", "color"],
      ["footerLogo", "Footer logo", "upload"],
      ["openGraphImage", "Open Graph image", "upload"],
      ["defaultProductImage", "Default product placeholder", "upload"],
      ["defaultCategoryImage", "Default category placeholder", "upload"],
      ["emailLogo", "Email logo", "upload"],
      ["invoiceLogo", "Invoice logo", "upload"],
    ],
  },
  {
    key: "social",
    title: "Social Links",
    fields: [
      ["facebook", "Facebook"],
      ["instagram", "Instagram"],
      ["youtube", "YouTube"],
      ["tiktok", "TikTok"],
      ["linkedin", "LinkedIn"],
      ["whatsapp", "WhatsApp"],
    ],
  },
  {
    key: "seo",
    title: "SEO",
    fields: [
      ["defaultPageTitle", "Default page title"],
      ["defaultMetaDescription", "Default meta description", "textarea"],
      ["defaultKeywords", "Default keywords"],
      ["openGraphImage", "Open Graph image"],
      ["canonicalSiteUrl", "Canonical site URL"],
      ["robotsSettings", "Robots settings"],
    ],
  },
] as const;

const commerceFields = [
  ["defaultDeliveryCharge", "Default delivery charge"],
  ["freeDeliveryThreshold", "Free-delivery threshold"],
  ["taxPercentage", "Tax percentage"],
  ["minimumOrderValue", "Minimum order value"],
  ["maximumOrderValue", "Maximum order value"],
  ["orderPrefix", "Order prefix", "text"],
  ["invoicePrefix", "Invoice prefix", "text"],
  ["lowStockDefaultThreshold", "Low-stock default threshold"],
] as const;

export default async function AdminSettingsPage() {
  await requirePermission("settings.update");
  const settings = await getSiteSettings();
  return (
    <AdminShell>
      <AdminHero
        title="Store Settings"
        description="Database-backed settings for storefront identity, support details, branding, commerce rules, social links and SEO defaults."
      />
      <form action={saveSiteSettingsAction} className="space-y-6">
        {groups.map((group) => (
          <section key={group.key} className="kg-card p-6">
            <h2 className="text-xl font-black text-navy">{group.title}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {group.fields.map(([name, label, type]) => (
                type === "upload" ? <CmsImageField key={name} label={label} name={`${group.key}.${name}`} value={String(settings.branding[name as keyof typeof settings.branding] ?? "")} /> : <Field
                  key={name}
                  label={label}
                  name={`${group.key}.${name}`}
                  type={type}
                  value={String(
                    settings[group.key][
                      name as keyof (typeof settings)[typeof group.key]
                    ] ?? "",
                  )}
                />
              ))}
            </div>
          </section>
        ))}
        <section className="kg-card p-6">
          <h2 className="text-xl font-black text-navy">Commerce</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {commerceFields.map(([name, label, type]) => (
              <Field
                key={name}
                label={label}
                name={`commerce.${name}`}
                type={type ?? "number"}
                value={String(settings.commerce[name] ?? "")}
              />
            ))}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <CheckField
              label="COD enabled"
              name="commerce.codEnabled"
              checked={settings.commerce.codEnabled}
            />
            <CheckField
              label="Online payment enabled"
              name="commerce.onlinePaymentEnabled"
              checked={settings.commerce.onlinePaymentEnabled}
            />
            <CheckField
              label="Tax enabled"
              name="commerce.taxEnabled"
              checked={settings.commerce.taxEnabled}
            />
          </div>
        </section>
        <button className="rounded-md bg-coral px-6 py-3 font-black text-white">
          Save Settings
        </button>
      </form>
    </AdminShell>
  );
}

function Field({
  label,
  name,
  value,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
}) {
  if (type === "textarea") {
    return (
      <label className="md:col-span-2">
        <span className="text-sm font-bold text-slate-600">{label}</span>
        <textarea
          name={name}
          defaultValue={value}
          rows={4}
          className="mt-1 w-full rounded-md border border-[var(--border)] p-3"
        />
      </label>
    );
  }
  return (
    <label>
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={value}
        className="mt-1 h-11 w-full rounded-md border border-[var(--border)] p-3"
      />
    </label>
  );
}

function CheckField({
  label,
  name,
  checked,
}: {
  label: string;
  name: string;
  checked: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-white p-3 font-bold text-navy">
      <input name={name} type="checkbox" defaultChecked={checked} />
      {label}
    </label>
  );
}
