import Link from "next/link";
import { DiscountType } from "@prisma/client";
import {
  archiveCouponAction,
  deleteCouponAction,
  duplicateCouponAction,
  setCouponActiveAction,
} from "@/app/actions/admin";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { money } from "@/lib/utils";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
import { AdminAlert, AdminEmpty, AdminPagination } from "@/components/admin/admin-ui";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function CouponsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    active?: string;
    type?: string;
    state?: string;
    page?: string;
    error?: string;
  }>;
}) {
  await requirePermission("settings.update");
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page ?? 1));
  const q = params?.q?.trim() ?? "";
  const active = params?.active ?? "";
  const type = params?.type ?? "";
  const state = params?.state ?? "";
  const now = new Date();
  const where = {
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(active === "active" ? { active: true, archivedAt: null } : {}),
    ...(active === "inactive"
      ? { OR: [{ active: false }, { archivedAt: { not: null } }] }
      : {}),
    ...(Object.values(DiscountType).includes(type as DiscountType)
      ? { type: type as DiscountType }
      : {}),
    ...(state === "expired" ? { expiresAt: { lt: now } } : {}),
    ...(state === "scheduled" ? { startsAt: { gt: now } } : {}),
    ...(state === "live"
      ? {
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
          ],
        }
      : {}),
  };
  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      include: { _count: { select: { usages: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 25,
      take: 25,
    }),
    prisma.coupon.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / 25));
  return (
    <AdminShell>
      <AdminHero
        title="Coupons"
        description="Authoritative checkout discounts, eligibility rules, usage limits and audit-safe coupon operations."
      />
      {params?.error ? (
        <AdminAlert>{params.error}</AdminAlert>
      ) : null}
      <div className="admin-section admin-toolbar">
        <form className="flex min-w-0 flex-1 flex-wrap gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search coupons"
            className="h-11 min-w-56 flex-1 rounded-md border px-3"
          />
          <select
            name="active"
            defaultValue={active}
            className="h-11 rounded-md border px-3"
          >
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive/archived</option>
          </select>
          <select
            name="type"
            defaultValue={type}
            className="h-11 rounded-md border px-3"
          >
            <option value="">Any type</option>
            {Object.values(DiscountType).map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <select
            name="state"
            defaultValue={state}
            className="h-11 rounded-md border px-3"
          >
            <option value="">Any date</option>
            <option value="live">Live</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
          </select>
          <button className="admin-button bg-navy px-4 text-white">
            Filter
          </button>
        </form>
        <div className="admin-actions">
          <Link
            href="/admin/coupons/export"
            className="admin-button admin-button-secondary"
          >
            CSV
          </Link>
          <Link
            href="/admin/coupons/new"
            className="admin-button admin-button-primary"
          >
            New coupon
          </Link>
        </div>
      </div>
      <section className="kg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase text-slate-500">
              <tr>
                {[
                  "Code",
                  "Name",
                  "Type",
                  "Value",
                  "Minimum",
                  "Max",
                  "Start",
                  "End",
                  "Usage",
                  "Per user",
                  "Active",
                  "Created",
                  "Updated",
                  "Actions",
                ].map((head) => (
                  <th key={head} className="p-3">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t border-[var(--border)]">
                  <td className="p-3">
                    <Link
                      href={`/admin/coupons/${coupon.id}`}
                      className="font-black text-navy"
                    >
                      {coupon.code}
                    </Link>
                  </td>
                  <td className="p-3">{coupon.name ?? "-"}</td>
                  <td className="p-3">{coupon.type.replaceAll("_", " ")}</td>
                  <td className="p-3">
                    {coupon.type === "FREE_DELIVERY"
                      ? "Free delivery"
                      : coupon.percentageValue
                        ? `${Number(coupon.percentageValue)}%`
                        : money(Number(coupon.fixedValue ?? coupon.value))}
                  </td>
                  <td className="p-3">
                    {coupon.minimumEligibleSubtotal
                      ? money(Number(coupon.minimumEligibleSubtotal))
                      : "None"}
                  </td>
                  <td className="p-3">
                    {coupon.maximumDiscount
                      ? money(Number(coupon.maximumDiscount))
                      : "None"}
                  </td>
                  <td className="p-3">
                    {coupon.startsAt?.toLocaleDateString("en-BD") ?? "Now"}
                  </td>
                  <td className="p-3">
                    {coupon.expiresAt?.toLocaleDateString("en-BD") ?? "None"}
                  </td>
                  <td className="p-3">
                    {coupon._count.usages}
                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                  </td>
                  <td className="p-3">{coupon.perCustomerLimit ?? "None"}</td>
                  <td className="p-3"><StatusBadge>{coupon.archivedAt ? "ARCHIVED" : !coupon.active ? "INACTIVE" : coupon.startsAt && coupon.startsAt > now ? "UPCOMING" : coupon.expiresAt && coupon.expiresAt < now ? "EXPIRED" : "ACTIVE"}</StatusBadge></td>
                  <td className="p-3">
                    {coupon.createdAt.toLocaleDateString("en-BD")}
                  </td>
                  <td className="p-3">
                    {coupon.updatedAt.toLocaleDateString("en-BD")}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/coupons/${coupon.id}/edit`}
                        className="admin-button admin-button-secondary"
                      >
                        Edit
                      </Link>
                      <form action={setCouponActiveAction}>
                        <input
                          type="hidden"
                          name="couponId"
                          value={coupon.id}
                        />
                        <input
                          type="hidden"
                          name="active"
                          value={String(!coupon.active)}
                        />
                        <button className="admin-button admin-button-secondary">
                          {coupon.active ? "Disable" : "Enable"}
                        </button>
                      </form>
                      <form action={duplicateCouponAction}>
                        <input
                          type="hidden"
                          name="couponId"
                          value={coupon.id}
                        />
                        <button className="admin-button admin-button-secondary">
                          Duplicate
                        </button>
                      </form>
                      <form action={archiveCouponAction}>
                        <input
                          type="hidden"
                          name="couponId"
                          value={coupon.id}
                        />
                        <button className="admin-button admin-button-secondary">
                          Archive
                        </button>
                      </form>
                      <form action={deleteCouponAction}>
                        <input
                          type="hidden"
                          name="couponId"
                          value={coupon.id}
                        />
                        <button className="admin-button admin-button-danger">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {!coupons.length ? <AdminEmpty colSpan={14} title="No coupons found" description="Adjust the filters or create a coupon for a new promotion." /> : null}
            </tbody>
          </table>
        </div>
      </section>
      <AdminPagination page={page} pages={pages} href={(next) => `/admin/coupons?q=${encodeURIComponent(q)}&active=${active}&type=${type}&state=${state}&page=${next}`} />
    </AdminShell>
  );
}
