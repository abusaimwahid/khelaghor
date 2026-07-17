import type { Category } from "@prisma/client";
import { saveCategoryAction } from "@/app/actions/admin";
import { CmsImageField } from "./cms-image-field";

type CategoryOption = Pick<Category, "id" | "name" | "parentId">;

export function CategoryForm({
  category,
  categories,
}: {
  category?: Category | null;
  categories: CategoryOption[];
}) {
  return (
    <form action={saveCategoryAction} className="kg-card grid gap-4 p-6">
      <input name="categoryId" type="hidden" value={category?.id ?? ""} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" name="name" value={category?.name ?? ""} required />
        <Field label="Name (বাংলা)" name="nameBn" value={category?.nameBn ?? ""} />
        <Field label="Slug" name="slug" value={category?.slug ?? ""} required />
        <label>
          <span className="text-sm font-bold text-slate-600">Parent category</span>
          <select
            name="parentId"
            defaultValue={category?.parentId ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-[var(--border)] bg-white px-3"
          >
            <option value="">Top level</option>
            {categories
              .filter((item) => item.id !== category?.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        <Field
          label="Sort order"
          name="sortOrder"
          value={String(category?.sortOrder ?? 0)}
          type="number"
        />
        <CmsImageField label="Image" name="image" value={category?.image ?? ""} />
        <Field label="Icon" name="icon" value={category?.icon ?? ""} />
        <Field
          label="Description"
          name="description"
          value={category?.description ?? ""}
          textarea
          wide
        />
        <Field label="Description (বাংলা)" name="descriptionBn" value={category?.descriptionBn ?? ""} textarea wide />
        <Field label="SEO title" name="seoTitle" value={category?.seoTitle ?? ""} />
        <Field
          label="SEO description"
          name="seoDescription"
          value={category?.seoDescription ?? ""}
          textarea
          wide
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 font-bold text-navy">
          <input name="active" type="checkbox" defaultChecked={category?.active ?? true} />
          Active
        </label>
        <label className="inline-flex items-center gap-2 font-bold text-navy">
          <input name="featured" type="checkbox" defaultChecked={category?.featured ?? false} />
          Featured
        </label>
      </div>
      <button className="w-fit rounded-md bg-coral px-6 py-3 font-black text-white">
        Save category
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
