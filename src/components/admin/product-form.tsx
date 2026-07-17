import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Archive, Save, Trash2 } from "lucide-react";
import {
  archiveProductAction,
  deleteProductAction,
  saveProductAction,
} from "@/app/actions/admin";
import { ProductImageManager } from "./product-image-manager";
import { UnsavedChangeWarning } from "./unsaved-change-warning";

type ProductForForm = Prisma.ProductGetPayload<{
  include: {
    categories: true;
    images: true;
    variants: true;
  };
}>;

type CategoryOption = {
  id: string;
  name: string;
  parent?: { name: string } | null;
};

type BrandOption = {
  id: string;
  name: string;
};

export function ProductForm({
  product,
  categories,
  brands,
  mode,
}: {
  product?: ProductForForm | null;
  categories: CategoryOption[];
  brands: BrandOption[];
  mode: "create" | "edit";
}) {
  const selectedCategories = new Set(
    product?.categories.map((category) => category.categoryId) ?? [],
  );
  const variantRows = [
    ...(product?.variants ?? []),
    ...Array.from({ length: mode === "create" ? 3 : 2 }, (_, index) => ({
      id: "",
      productId: product?.id ?? "",
      name: "",
      sku: "",
      barcode: "",
      size: "",
      colour: "",
      material: "",
      style: "",
      priceOverride: null,
      salePriceOverride: null,
      costPriceOverride: null,
      stock: 0,
      reservedStock: 0,
      lowStockThreshold: 5,
      weightOverride: null,
      image: "",
      active: true,
      sortOrder: (product?.variants.length ?? 0) + index,
      status: "PUBLISHED" as const,
    })),
  ];
  const formId = `product-form-${product?.id ?? "new"}`;
  return (
    <>
      <UnsavedChangeWarning formId={formId} />
      <form id={formId} action={saveProductAction} className="space-y-6">
        {product ? (
          <input type="hidden" name="productId" value={product.id} />
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-5 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-navy">
              {mode === "create" ? "Create Product" : "Edit Product"}
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Save drafts safely, publish when ready, and manage images and
              variants from one workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/products"
              className="rounded-md border border-[var(--border)] px-4 py-2 font-black text-navy"
            >
              Back
            </Link>
            <button
              name="status"
              value="DRAFT"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 font-black text-navy"
            >
              <Save className="h-4 w-4" />
              Save draft
            </button>
            <button
              name="status"
              value="PUBLISHED"
              className="inline-flex items-center gap-2 rounded-md bg-coral px-4 py-2 font-black text-white"
            >
              <Save className="h-4 w-4" />
              Publish
            </button>
          </div>
        </div>

        <Section title="Basic information">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" name="name" value={product?.name} required />
            <Field label="Name (বাংলা)" name="nameBn" value={product?.nameBn} />
            <Field label="Slug" name="slug" value={product?.slug} required />
            <Field label="SKU" name="sku" value={product?.sku} required />
            <Field label="Barcode" name="barcode" value={product?.barcode} />
            <label>
              <Label>Brand</Label>
              <select
                name="brandId"
                defaultValue={product?.brandId ?? ""}
                className="mt-1 h-11 w-full rounded-md border border-[var(--border)] px-3"
              >
                <option value="">No brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Product type"
              name="productType"
              value={product?.productType}
            />
            <Field label="Tags" name="tags" value={product?.tags} />
            <Field label="Gender" name="gender" value={product?.gender} />
            <Field
              label="Age groups"
              name="ageGroup"
              value={product?.ageGroup}
            />
          </div>
          <div className="mt-4">
            <Label>Categories</Label>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 rounded-md border border-[var(--border)] p-3 text-sm font-bold text-navy"
                >
                  <input
                    name="categoryIds"
                    type="checkbox"
                    value={category.id}
                    defaultChecked={selectedCategories.has(category.id)}
                  />
                  <span>
                    {category.parent ? `${category.parent.name} / ` : ""}
                    {category.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Product content">
          <div className="grid gap-4">
            <TextArea
              label="Short description"
              name="shortDescription"
              value={product?.shortDescription}
              required
            />
            <TextArea label="Short description (বাংলা)" name="shortDescriptionBn" value={product?.shortDescriptionBn} />
            <TextArea
              label="Full description"
              name="fullDescription"
              value={product?.fullDescription}
              rows={7}
              required
            />
            <TextArea label="Full description (বাংলা)" name="fullDescriptionBn" value={product?.fullDescriptionBn} rows={7} />
            <TextArea
              label="Safety information"
              name="safetyInfo"
              value={product?.safetyInfo}
            />
            <TextArea
              label="Care instructions"
              name="careInstructions"
              value={product?.careInstructions}
            />
            <TextArea
              label="Warranty information"
              name="warranty"
              value={product?.warranty}
            />
            <TextArea
              label="Specifications"
              name="specifications"
              value={specificationsText(product?.specifications)}
            />
            <Check
              label="Return eligible"
              name="returnEligible"
              checked={product?.returnEligible ?? true}
            />
          </div>
        </Section>

        <Section title="Pricing">
          <div className="grid gap-4 md:grid-cols-3">
            <Field
              label="Cost price"
              name="costPrice"
              type="number"
              value={decimal(product?.costPrice)}
            />
            <Field
              label="Regular price"
              name="regularPrice"
              type="number"
              value={decimal(product?.regularPrice)}
              required
            />
            <Field
              label="Sale price"
              name="salePrice"
              type="number"
              value={decimal(product?.salePrice)}
            />
            <Field
              label="Sale start date"
              name="saleStartsAt"
              type="datetime-local"
              value={dateTime(product?.saleStartsAt)}
            />
            <Field
              label="Sale end date"
              name="saleEndsAt"
              type="datetime-local"
              value={dateTime(product?.saleEndsAt)}
            />
            <Field
              label="Tax percentage"
              name="tax"
              type="number"
              value={decimal(product?.tax)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Check
              label="Taxable"
              name="taxable"
              checked={product?.taxable ?? false}
            />
          </div>
        </Section>

        <Section title="Inventory">
          <div className="grid gap-4 md:grid-cols-3">
            <Field
              label="Initial stock"
              name="stock"
              type="number"
              value={product?.stock ?? 0}
            />
            <Field
              label="Reserved quantity"
              name="reservedStock"
              type="number"
              value={product?.reservedStock ?? 0}
            />
            <Field
              label="Low-stock threshold"
              name="lowStockThreshold"
              type="number"
              value={product?.lowStockThreshold ?? 5}
            />
            <Field
              label="Minimum order quantity"
              name="minQuantity"
              type="number"
              value={product?.minQuantity ?? 1}
            />
            <Field
              label="Maximum order quantity"
              name="maxQuantity"
              type="number"
              value={product?.maxQuantity}
            />
            <Field
              label="Stock status"
              name="stockStatus"
              value={product?.stockStatus ?? "IN_STOCK"}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Check
              label="Track stock"
              name="trackStock"
              checked={product?.trackStock ?? true}
            />
            <Check
              label="Allow backorder"
              name="allowBackorder"
              checked={product?.allowBackorder ?? false}
            />
          </div>
        </Section>

        <Section title="Shipping">
          <div className="grid gap-4 md:grid-cols-5">
            <Field
              label="Weight"
              name="weight"
              type="number"
              value={product?.weight}
            />
            <Field
              label="Length"
              name="length"
              type="number"
              value={product?.length}
            />
            <Field
              label="Width"
              name="width"
              type="number"
              value={product?.width}
            />
            <Field
              label="Height"
              name="height"
              type="number"
              value={product?.height}
            />
            <Field
              label="Delivery class"
              name="deliveryClass"
              value={product?.deliveryClass}
            />
          </div>
        </Section>

        <Section title="Product flags">
          <div className="flex flex-wrap gap-3">
            <Check
              label="Featured"
              name="featured"
              checked={product?.featured ?? false}
            />
            <Check
              label="New arrival"
              name="newArrival"
              checked={product?.newArrival ?? false}
            />
            <Check
              label="Best seller"
              name="bestSeller"
              checked={product?.bestSeller ?? false}
            />
            <Check
              label="Flash sale"
              name="flashSale"
              checked={product?.flashSale ?? false}
            />
            <Check
              label="Pre-order"
              name="preOrder"
              checked={product?.preOrder ?? false}
            />
            <Check
              label="Active"
              name="active"
              checked={product?.active ?? true}
            />
          </div>
        </Section>

        <ProductImageManager
          initialImages={(product?.images ?? []).map((image) => ({
            url: image.url,
            alt: image.alt,
            sortOrder: image.sortOrder,
            variantKey: image.variantKey ?? "",
          }))}
        />

        <Section title="Variants">
          <div className="space-y-4">
            {variantRows.map((variant, index) => (
              <div
                key={variant.id || `new-${index}`}
                className="rounded-lg border border-[var(--border)] p-4"
              >
                <input name="variantId" type="hidden" value={variant.id} />
                <div className="grid gap-3 md:grid-cols-4">
                  <Field
                    label="Variant name"
                    name="variantName"
                    value={variant.name}
                  />
                  <Field
                    label="Variant SKU"
                    name="variantSku"
                    value={variant.sku}
                  />
                  <Field
                    label="Barcode"
                    name="variantBarcode"
                    value={variant.barcode}
                  />
                  <Field label="Size" name="variantSize" value={variant.size} />
                  <Field
                    label="Colour"
                    name="variantColour"
                    value={variant.colour}
                  />
                  <Field
                    label="Material"
                    name="variantMaterial"
                    value={variant.material}
                  />
                  <Field
                    label="Style"
                    name="variantStyle"
                    value={variant.style}
                  />
                  <Field
                    label="Price override"
                    name="variantPriceOverride"
                    type="number"
                    value={decimal(variant.priceOverride)}
                  />
                  <Field
                    label="Sale override"
                    name="variantSalePriceOverride"
                    type="number"
                    value={decimal(variant.salePriceOverride)}
                  />
                  <Field
                    label="Cost override"
                    name="variantCostPriceOverride"
                    type="number"
                    value={decimal(variant.costPriceOverride)}
                  />
                  <Field
                    label="Stock"
                    name="variantStock"
                    type="number"
                    value={variant.stock}
                  />
                  <Field
                    label="Reserved"
                    name="variantReservedStock"
                    type="number"
                    value={variant.reservedStock}
                  />
                  <Field
                    label="Low-stock threshold"
                    name="variantLowStockThreshold"
                    type="number"
                    value={variant.lowStockThreshold}
                  />
                  <Field
                    label="Weight override"
                    name="variantWeightOverride"
                    type="number"
                    value={variant.weightOverride}
                  />
                  <Field
                    label="Image URL"
                    name="variantImage"
                    value={variant.image}
                  />
                  <label>
                    <Label>Status</Label>
                    <select
                      name="variantActive"
                      defaultValue={variant.active ? "true" : "false"}
                      className="mt-1 h-11 w-full rounded-md border border-[var(--border)] px-3"
                    >
                      <option value="true">Active</option>
                      <option value="false">Disabled</option>
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="SEO">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="SEO title"
              name="seoTitle"
              value={product?.seoTitle}
            />
            <Field
              label="Keywords"
              name="searchKeywords"
              value={product?.searchKeywords}
            />
            <Field
              label="Canonical override"
              name="canonicalUrl"
              value={product?.canonicalUrl}
            />
            <Field
              label="Social sharing image"
              name="socialImage"
              value={product?.socialImage}
            />
            <TextArea
              label="SEO description"
              name="seoDescription"
              value={product?.seoDescription}
            />
          </div>
        </Section>

        <div className="flex flex-wrap justify-between gap-3 rounded-lg bg-white p-5 shadow-sm">
          <button
            name="status"
            value={product?.status ?? "DRAFT"}
            className="inline-flex items-center gap-2 rounded-md bg-coral px-5 py-3 font-black text-white"
          >
            <Save className="h-4 w-4" />
            Save product
          </button>
        </div>
      </form>
      {product ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={archiveProductAction}>
            <input type="hidden" name="productId" value={product.id} />
            <button className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 font-black text-navy">
              <Archive className="h-4 w-4" />
              Archive
            </button>
          </form>
          <form action={deleteProductAction}>
            <input type="hidden" name="productId" value={product.id} />
            <button className="inline-flex items-center gap-2 rounded-md border border-coral px-4 py-2 font-black text-coral">
              <Trash2 className="h-4 w-4" />
              Delete if unused
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-navy">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-bold text-slate-600">{children}</span>;
}

function Field({
  label,
  name,
  value,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  value?: string | number | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <Label>{label}</Label>
      <input
        name={name}
        type={type}
        step={type === "number" ? "0.01" : undefined}
        min={type === "number" ? "0" : undefined}
        defaultValue={value ?? ""}
        required={required}
        className="mt-1 h-11 w-full rounded-md border border-[var(--border)] px-3"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  value,
  rows = 4,
  required = false,
}: {
  label: string;
  name: string;
  value?: string | null;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label>
      <Label>{label}</Label>
      <textarea
        name={name}
        rows={rows}
        defaultValue={value ?? ""}
        required={required}
        className="mt-1 w-full rounded-md border border-[var(--border)] p-3"
      />
    </label>
  );
}

function Check({
  label,
  name,
  checked,
}: {
  label: string;
  name: string;
  checked: boolean;
}) {
  return (
    <>
      <input type="hidden" name={name} value="false" />
      <label className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-bold text-navy">
        <input name={name} type="checkbox" defaultChecked={checked} />
        {label}
      </label>
    </>
  );
}

function decimal(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function dateTime(value?: Date | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
}

function specificationsText(value: unknown) {
  if (!value) return "";
  if (typeof value === "object" && "text" in value) {
    return String((value as { text?: string }).text ?? "");
  }
  return JSON.stringify(value, null, 2);
}
