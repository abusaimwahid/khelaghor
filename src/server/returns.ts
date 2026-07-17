import { OrderStatus, ReturnStatus } from "@prisma/client";
import { prisma } from "./db";
import { adjustInventory } from "./inventory";
import { audit, notifyUser } from "./notify";

const activeReturnStatuses: ReturnStatus[] = [
  ReturnStatus.REQUESTED,
  ReturnStatus.UNDER_REVIEW,
  ReturnStatus.APPROVED,
  ReturnStatus.PICKUP_SCHEDULED,
  ReturnStatus.IN_TRANSIT,
  ReturnStatus.PRODUCT_RECEIVED,
  ReturnStatus.INSPECTING,
];

export class ReturnError extends Error {
  constructor(
    message: string,
    readonly code = "RETURN_INVALID",
  ) {
    super(message);
  }
}

export async function checkReturnEligibility(input: {
  userId: string;
  orderItemId: string;
  quantity: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const item = await prisma.orderItem.findFirst({
    where: { id: input.orderItemId, order: { userId: input.userId } },
    include: {
      order: true,
      product: { include: { categories: { include: { category: true } } } },
      returnItems: { include: { returnRequest: true } },
    },
  });
  if (!item) throw new ReturnError("Order item is not available.");
  if (
    item.order.status !== OrderStatus.DELIVERED &&
    item.order.status !== OrderStatus.RETURNED
  ) {
    throw new ReturnError("Only delivered orders are eligible for return.");
  }
  if (!item.product.returnEligible)
    throw new ReturnError("This product is not returnable.");
  const deliveredAt = item.order.deliveredAt ?? item.order.updatedAt;
  const windowDays = 7;
  if (
    now.getTime() - deliveredAt.getTime() >
    windowDays * 24 * 60 * 60 * 1000
  ) {
    throw new ReturnError("The return window has expired.");
  }
  const previouslyReturned = item.returnItems
    .filter((row) => row.returnRequest.status !== ReturnStatus.REJECTED)
    .reduce((sum, row) => sum + row.quantity, 0);
  const active = item.returnItems.some((row) =>
    activeReturnStatuses.includes(row.returnRequest.status),
  );
  if (active)
    throw new ReturnError("This item is already in an active return request.");
  if (
    input.quantity < 1 ||
    input.quantity > item.quantity - previouslyReturned
  ) {
    throw new ReturnError(
      "Requested return quantity exceeds the eligible quantity.",
    );
  }
  return item;
}

export async function createReturnRequest(input: {
  userId: string;
  orderItemId: string;
  quantity: number;
  reason: string;
  description?: string | null;
  resolution?: string | null;
  evidenceUrls?: string[];
}) {
  const item = await checkReturnEligibility(input);
  const request = await prisma.returnRequest.create({
    data: {
      number: returnNumber(),
      orderId: item.orderId,
      userId: input.userId,
      reason: input.reason,
      description: input.description,
      resolution: input.resolution,
      items: { create: { orderItemId: item.id, quantity: input.quantity } },
      evidence: { create: (input.evidenceUrls ?? []).map((url) => ({ url })) },
      history: {
        create: {
          toStatus: ReturnStatus.REQUESTED,
          publicNote: "Return request submitted.",
        },
      },
    },
  });
  await notifyUser({
    userId: input.userId,
    type: "RETURN_SUBMITTED",
    title: "Return submitted",
    body: `Return ${request.number} was submitted.`,
  });
  await prisma.notification.create({
    data: {
      type: "ADMIN_RETURN_REQUESTED",
      title: "New return request",
      body: `Return ${request.number} needs review.`,
      resourceType: "ReturnRequest",
      resourceId: request.id,
      href: `/admin/returns/${request.id}`,
    },
  });
  return request;
}

export async function transitionReturn(input: {
  returnId: string;
  status: ReturnStatus;
  actorId: string;
  publicNote?: string | null;
  privateAdminNote?: string | null;
}) {
  const request = await prisma.returnRequest.findUniqueOrThrow({
    where: { id: input.returnId },
  });
  if (request.status === input.status) return request;
  const updated = await prisma.returnRequest.update({
    where: { id: request.id },
    data: {
      status: input.status,
      history: {
        create: {
          fromStatus: request.status,
          toStatus: input.status,
          actorId: input.actorId,
          publicNote: input.publicNote,
          privateAdminNote: input.privateAdminNote,
        },
      },
    },
  });
  await audit({
    userId: input.actorId,
    action: "return.status",
    entity: "ReturnRequest",
    entityId: request.id,
    metadata: { from: request.status, to: input.status },
  });
  await notifyUser({
    userId: updated.userId,
    type: `RETURN_${input.status}`,
    title: "Return updated",
    body: `Return ${updated.number} is now ${input.status}.`,
  });
  return updated;
}

export async function inspectReturn(input: {
  returnId: string;
  actorId: string;
  resellable: boolean;
  note: string;
}) {
  const request = await prisma.returnRequest.findUniqueOrThrow({
    where: { id: input.returnId },
    include: { items: { include: { orderItem: true } } },
  });
  if (
    request.status !== ReturnStatus.PRODUCT_RECEIVED &&
    request.status !== ReturnStatus.INSPECTING
  ) {
    throw new ReturnError("Return must be received before inspection.");
  }
  for (const item of request.items) {
    if (input.resellable && item.resellableQty === 0) {
      await adjustInventory({
        productId: item.orderItem.productId,
        variantId: item.orderItem.variantId,
        difference: item.quantity,
        movementType: "RETURN",
        reason: "Return inspected as resellable",
        reference: request.number,
        idempotencyKey: `return-resellable-${item.id}`,
        adminUserId: input.actorId,
        notes: input.note,
      });
      await prisma.returnItem.update({
        where: { id: item.id },
        data: { resellableQty: item.quantity },
      });
    }
    if (!input.resellable && item.damagedQty === 0) {
      await recordDamagedReturn({
        productId: item.orderItem.productId,
        variantId: item.orderItem.variantId,
        quantity: item.quantity,
        reference: request.number,
        idempotencyKey: `return-damaged-${item.id}`,
        adminUserId: input.actorId,
        note: input.note,
      });
      await prisma.returnItem.update({
        where: { id: item.id },
        data: { damagedQty: item.quantity },
      });
    }
  }
  const status = input.resellable ? ReturnStatus.CLOSED : ReturnStatus.CLOSED;
  const updated = await prisma.returnRequest.update({
    where: { id: request.id },
    data: {
      status,
      inspectedAt: new Date(),
      inspectionResult: input.resellable ? "RESELLABLE" : "DAMAGED",
      history: {
        create: {
          fromStatus: request.status,
          toStatus: status,
          actorId: input.actorId,
          publicNote: "Return inspection completed.",
          privateAdminNote: input.note,
        },
      },
    },
  });
  await audit({
    userId: input.actorId,
    action: input.resellable
      ? "return.inspect.resellable"
      : "return.inspect.damaged",
    entity: "ReturnRequest",
    entityId: request.id,
  });
  return updated;
}

async function recordDamagedReturn(input: {
  productId: string;
  variantId?: string | null;
  quantity: number;
  reference: string;
  idempotencyKey: string;
  adminUserId: string;
  note: string;
}) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.inventoryMovement.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return;
    const inventory = await tx.inventory.upsert({
      where: { productId: input.productId },
      create: { productId: input.productId, available: 0 },
      update: {},
    });
    await tx.inventory.update({
      where: { id: inventory.id },
      data: { damaged: { increment: input.quantity } },
    });
    await tx.inventoryMovement.create({
      data: {
        inventoryId: inventory.id,
        variantId: input.variantId ?? null,
        movementType: "DAMAGE",
        previousQuantity: inventory.available,
        newQuantity: inventory.available,
        difference: 0,
        reservedBefore: inventory.reserved,
        reservedAfter: inventory.reserved,
        reason: "Return inspected as damaged",
        reference: input.reference,
        idempotencyKey: input.idempotencyKey,
        adminUserId: input.adminUserId,
        notes: input.note,
      },
    });
  });
}

function returnNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `RET-${stamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
