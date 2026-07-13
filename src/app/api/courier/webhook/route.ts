import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { mapCourierStatus, type CourierStatus } from "@/server/courier";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("x-khelaghor-courier-signature");
  if (
    process.env.COURIER_WEBHOOK_SECRET &&
    signature !== process.env.COURIER_WEBHOOK_SECRET
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const body = (await request.json()) as {
    provider?: string;
    courierOrderId?: string;
    trackingId?: string;
    status?: CourierStatus;
  };
  if (!body.courierOrderId || !body.status)
    return NextResponse.json(
      { ok: false, message: "Invalid courier webhook" },
      { status: 400 },
    );
  const order = await prisma.order.findFirst({
    where: { courierOrderId: body.courierOrderId },
  });
  if (!order) return NextResponse.json({ ok: true, ignored: true });
  const mapped = mapCourierStatus(body.status);
  if (!mapped || mapped === order.status)
    return NextResponse.json({ ok: true });
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: mapped,
        trackingId: body.trackingId ?? order.trackingId,
        ...(mapped === "SHIPPED" ? { shippedAt: new Date() } : {}),
        ...(mapped === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: mapped,
        note: `Courier webhook: ${body.status}`,
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
