import type { Brand } from "@prisma/client";
import { saveBrandAction } from "@/app/actions/admin";
import { CmsImageField } from "./cms-image-field";

export function BrandForm({ brand }: { brand?: Brand | null }) {
  return (
    <form action={saveBrandAction} className="kg-card grid gap-4 p-6">
      <input name="brandId" type="hidden" value={brand?.id ?? ""} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" name="name" value={brand?.name ?? ""} required />
        <Field label="Slug" name="slug" value={brand?.slug ?? ""} required />
        <CmsImageField label="Logo" name="logo" value={brand?.logo ?? ""} />
        <Field label="Website" name="website" value={brand?.website ?? ""} type="url" />
        <Field label="Country" name="country" value={brand?.country ?? ""} />
        <Field
          label="Description"
          name="description"
          value={brand?.description ?? ""}
          textarea
          wide
        />
        <Field label="Description (বাংলা)" name="descriptionBn" value={brand?.descriptionBn ?? ""} textarea wide />
        <Field label="SEO title" name="seoTitle" value={brand?.seoTitle ?? ""} />
        <Field
          label="SEO description"
          name="seoDescription"
          value={brand?.seoDescription ?? ""}
          textarea
          wide
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 font-bold text-navy">
          <input name="active" type="checkbox" defaultChecked={brand?.active ?? true} />
          Active
        </label>
        <label className="inline-flex items-center gap-2 font-bold text-navy">
          <input name="featured" type="checkbox" defaultChecked={brand?.featured ?? false} />
          Featured
        </label>
      </div>
      <button className="w-fit rounded-md bg-coral px-6 py-3 font-black text-white">
        Save brand
      </button>
    </form>
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
        <textarea
          name={name}
          defaultValue={value}
          rows={4}
          className="mt-1 w-full rounded-md border border-[var(--border)] p-3"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          defaultValue={value}
          className="mt-1 h-11 w-full rounded-md border border-[var(--border)] p-3"
        />
      )}
    </label>
  );
}
