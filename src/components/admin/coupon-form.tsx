import { DiscountType, type Prisma } from "@prisma/client";
import { saveCouponAction } from "@/app/actions/admin";

type CouponWithRelations = Prisma.CouponGetPayload<{
  include: { products: true; categories: true; brands: true; customers: true };
}>;

export function CouponForm({
  coupon,
  products,
  categories,
  brands,
  customers,
}: {
  coupon?: CouponWithRelations | null;
  products: { id: string; name: string; sku: string }[];
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  customers: { id: string; email: string; name: string | null }[];
}) {
  const selectedProducts = new Set(
    coupon?.products.map((row) => row.productId) ?? [],
  );
  const selectedCategories = new Set(
    coupon?.categories.map((row) => row.categoryId) ?? [],
  );
  const selectedBrands = new Set(
    coupon?.brands.map((row) => row.brandId) ?? [],
  );
  const selectedCustomers = new Set(
    coupon?.customers.map((row) => row.userId) ?? [],
  );
  return (
    <form action={saveCouponAction} className="space-y-5">
      <input type="hidden" name="couponId" value={coupon?.id ?? ""} />
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Coupon</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Code" name="code" value={coupon?.code ?? ""} required />
          <Field label="Name" name="name" value={coupon?.name ?? ""} />
          <label>
            <span className="text-sm font-bold text-slate-600">Type</span>
            <select
              name="type"
              defaultValue={coupon?.type ?? DiscountType.PERCENT}
              className="mt-1 h-11 w-full rounded-md border px-3"
            >
              {Object.values(DiscountType).map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Percentage value"
            name="percentageValue"
            value={decimal(coupon?.percentageValue ?? coupon?.value)}
            type="number"
            step="0.01"
          />
          <Field
            label="Fixed value"
            name="fixedValue"
            value={decimal(coupon?.fixedValue)}
            type="number"
            step="0.01"
          />
          <Field
            label="Minimum eligible subtotal"
            name="minimumEligibleSubtotal"
            value={decimal(
              coupon?.minimumEligibleSubtotal ?? coupon?.minimumSpend,
            )}
            type="number"
            step="0.01"
          />
          <Field
            label="Maximum discount"
            name="maximumDiscount"
            value={decimal(coupon?.maximumDiscount)}
            type="number"
            step="0.01"
          />
          <Field
            label="Usage limit"
            name="usageLimit"
            value={coupon?.usageLimit?.toString() ?? ""}
            type="number"
          />
          <Field
            label="Per-user limit"
            name="perCustomerLimit"
            value={coupon?.perCustomerLimit?.toString() ?? ""}
            type="number"
          />
          <Field
            label="Start date"
            name="startsAt"
            value={dateValue(coupon?.startsAt)}
            type="datetime-local"
          />
          <Field
            label="End date"
            name="expiresAt"
            value={dateValue(coupon?.expiresAt)}
            type="datetime-local"
          />
          <Field
            label="Description"
            name="description"
            value={coupon?.description ?? ""}
            textarea
            wide
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <Check
            label="Active"
            name="active"
            checked={coupon?.active ?? true}
          />
          <Check
            label="Exclude sale products"
            name="excludedSaleProducts"
            checked={coupon?.excludedSaleProducts ?? false}
          />
          <Check
            label="Stackable"
            name="stackable"
            checked={coupon?.stackable ?? false}
          />
          <Check
            label="First order only"
            name="firstOrderOnly"
            checked={coupon?.firstOrderOnly ?? false}
          />
        </div>
      </section>

      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Eligibility</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Multi
            label="Products"
            name="productIds"
            options={products.map((item) => ({
              value: item.id,
              label: `${item.name} (${item.sku})`,
            }))}
            selected={selectedProducts}
          />
          <Multi
            label="Categories"
            name="categoryIds"
            options={categories.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            selected={selectedCategories}
          />
          <Multi
            label="Brands"
            name="brandIds"
            options={brands.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            selected={selectedBrands}
          />
          <Multi
            label="Customers"
            name="customerIds"
            options={customers.map((item) => ({
              value: item.id,
              label: `${item.email}${item.name ? ` (${item.name})` : ""}`,
            }))}
            selected={selectedCustomers}
          />
          <Multi
            label="Allowed payment methods"
            name="allowedPaymentMethods"
            options={[
              "COD",
              "SSLCOMMERZ",
              "BKASH",
              "NAGAD",
              "ROCKET",
              "CARD",
            ].map((value) => ({ value, label: value }))}
            selected={new Set(coupon?.allowedPaymentMethods ?? [])}
          />
        </div>
      </section>
      <button className="rounded-md bg-coral px-6 py-3 font-black text-white">
        Save coupon
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  type = "text",
  step,
  required = false,
  textarea = false,
  wide = false,
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
  step?: string;
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
          rows={3}
          className="mt-1 w-full rounded-md border p-3"
        />
      ) : (
        <input
          name={name}
          type={type}
          step={step}
          required={required}
          defaultValue={value}
          className="mt-1 h-11 w-full rounded-md border p-3"
        />
      )}
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
    <label className="inline-flex items-center gap-2 font-bold text-navy">
      <input name={name} type="checkbox" defaultChecked={checked} />
      {label}
    </label>
  );
}

function Multi({
  label,
  name,
  options,
  selected,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  selected: Set<string>;
}) {
  return (
    <label>
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <select
        name={name}
        multiple
        defaultValue={Array.from(selected)}
        className="mt-1 min-h-36 w-full rounded-md border p-3"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function decimal(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function dateValue(value?: Date | null) {
  return value ? value.toISOString().slice(0, 16) : "";
}
