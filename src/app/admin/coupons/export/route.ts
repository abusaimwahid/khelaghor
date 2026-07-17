import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";

export const runtime = "nodejs";

export async function GET() {
  await requirePermission("settings.update");
  const coupons = await prisma.coupon.findMany({
    include: { _count: { select: { usages: true } } },
    orderBy: { createdAt: "desc" },
  });
  const rows = [
    [
      "Code",
      "Name",
      "Type",
      "Value",
      "Minimum subtotal",
      "Maximum discount",
      "Start date",
      "End date",
      "Usage count",
      "Usage limit",
      "Per-user limit",
      "Active",
      "Created",
      "Updated",
    ],
    ...coupons.map((coupon) => [
      coupon.code,
      coupon.name ?? "",
      coupon.type,
      String(coupon.percentageValue ?? coupon.fixedValue ?? coupon.value),
      String(coupon.minimumEligibleSubtotal ?? coupon.minimumSpend ?? ""),
      String(coupon.maximumDiscount ?? ""),
      coupon.startsAt?.toISOString() ?? "",
      coupon.expiresAt?.toISOString() ?? "",
      String(coupon._count.usages),
      String(coupon.usageLimit ?? ""),
      String(coupon.perCustomerLimit ?? ""),
      String(coupon.active && !coupon.archivedAt),
      coupon.createdAt.toISOString(),
      coupon.updatedAt.toISOString(),
    ]),
  ];
  return new NextResponse(
    rows.map((row) => row.map(csv).join(",")).join("\n"),
    {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=khelaghor-coupons.csv",
      },
    },
  );
}

function csv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
