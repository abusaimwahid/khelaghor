import { RefundStatus } from "@prisma/client";
import { prisma } from "./db";
import { audit, notifyUser } from "./notify";

export class RefundError extends Error {
  constructor(
    message: string,
    readonly code = "REFUND_INVALID",
  ) {
    super(message);
  }
}

export async function refundableAmount(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { refunds: true },
  });
  const completedOrActive = order.refunds
    .filter(
      (refund) =>
        refund.status !== RefundStatus.CANCELLED &&
        refund.status !== RefundStatus.FAILED,
    )
    .reduce((sum, refund) => sum + Number(refund.amount), 0);
  return Math.max(0, Number(order.total) - completedOrActive);
}

export async function createRefund(input: {
  orderId: string;
  returnRequestId?: string | null;
  amount: number;
  method: string;
  reason?: string | null;
  adminNote?: string | null;
  createdById: string;
  idempotencyKey?: string | null;
}) {
  if (input.idempotencyKey) {
    const existing = await prisma.refund.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return existing;
  }
  const remaining = await refundableAmount(input.orderId);
  if (input.amount <= 0 || input.amount > remaining)
    throw new RefundError("Refund exceeds refundable amount.");
  const refund = await prisma.refund.create({
    data: {
      number: refundNumber(),
      orderId: input.orderId,
      returnRequestId: input.returnRequestId ?? undefined,
      amount: input.amount,
      method: input.method,
      reason: input.reason,
      adminNote: input.adminNote,
      createdById: input.createdById,
      idempotencyKey: input.idempotencyKey,
      status: RefundStatus.APPROVED,
    },
    include: { order: true },
  });
  await audit({
    userId: input.createdById,
    action: "refund.approve",
    entity: "Refund",
    entityId: refund.id,
    metadata: { amount: input.amount },
  });
  await notifyUser({
    userId: refund.order.userId,
    type: "REFUND_APPROVED",
    title: "Refund approved",
    body: `Refund ${refund.number} was approved.`,
  });
  return refund;
}

export async function completeRefund(input: {
  refundId: string;
  actorId: string;
  externalTransactionId?: string | null;
}) {
  const refund = await prisma.refund.update({
    where: { id: input.refundId },
    data: {
      status: RefundStatus.COMPLETED,
      processedAt: new Date(),
      externalTransactionId: input.externalTransactionId,
    },
    include: { order: true },
  });
  await audit({
    userId: input.actorId,
    action: "refund.complete",
    entity: "Refund",
    entityId: refund.id,
  });
  await notifyUser({
    userId: refund.order.userId,
    type: "REFUND_COMPLETED",
    title: "Refund completed",
    body: `Refund ${refund.number} was completed.`,
  });
  return refund;
}

function refundNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `RF-${stamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
