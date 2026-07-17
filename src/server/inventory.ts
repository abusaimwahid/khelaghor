import { Prisma } from "@prisma/client";
import { prisma } from "./db";

export const inventoryMovementTypes = [
  "PURCHASE_RESTOCK",
  "MANUAL_INCREASE",
  "MANUAL_DECREASE",
  "DAMAGE",
  "RETURN",
  "CORRECTION",
  "INCOMING_STOCK",
  "RESERVATION",
  "RESERVATION_RELEASE",
  "SALE",
] as const;

export type InventoryMovementType = (typeof inventoryMovementTypes)[number];

export async function adjustInventory(input: {
  productId: string;
  variantId?: string | null;
  difference: number;
  reservedDifference?: number;
  movementType?: InventoryMovementType;
  reason: string;
  reference?: string;
  idempotencyKey?: string;
  adminUserId?: string;
  notes?: string;
}) {
  if (!Number.isInteger(input.difference)) {
    throw new Error("Stock difference must be a whole number.");
  }
  if (!Number.isInteger(input.reservedDifference ?? 0)) {
    throw new Error("Reserved stock difference must be a whole number.");
  }
  if (!input.reason.trim()) throw new Error("Reason is required.");

  return prisma.$transaction(async (tx) => {
    if (input.idempotencyKey) {
      const existing = await tx.inventoryMovement.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) return existing;
    }

    const inventory = await tx.inventory.upsert({
      where: { productId: input.productId },
      create: { productId: input.productId, available: 0 },
      update: {},
    });
    const reservedDifference = input.reservedDifference ?? 0;

    if (input.variantId) {
      const variant = await tx.productVariant.findUniqueOrThrow({
        where: { id: input.variantId },
      });
      if (variant.productId !== input.productId) {
        throw new Error("Variant does not belong to selected product.");
      }
      const previousQuantity = variant.stock;
      const previousReserved = variant.reservedStock;
      const newQuantity = previousQuantity + input.difference;
      const newReserved = previousReserved + reservedDifference;
      if (newQuantity < 0) throw new Error("Stock cannot be negative.");
      if (newReserved < 0 || newReserved > newQuantity) {
        throw new Error("Reserved stock is invalid.");
      }
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: newQuantity, reservedStock: newReserved },
      });
      return tx.inventoryMovement.create({
        data: movementData({
          inventoryId: inventory.id,
          variantId: variant.id,
          previousQuantity,
          newQuantity,
          reservedBefore: previousReserved,
          reservedAfter: newReserved,
          input,
        }),
      });
    }

    const product = await tx.product.findUniqueOrThrow({
      where: { id: input.productId },
    });
    const previousQuantity = inventory.available;
    const previousReserved = inventory.reserved;
    const newQuantity = previousQuantity + input.difference;
    const newReserved = previousReserved + reservedDifference;
    if (newQuantity < 0) throw new Error("Stock cannot be negative.");
    if (newReserved < 0 || newReserved > newQuantity) {
      throw new Error("Reserved stock is invalid.");
    }

    const soldDelta = input.movementType === "SALE" ? Math.abs(input.difference) : 0;
    const returnedDelta = input.movementType === "RETURN" ? Math.max(0, input.difference) : 0;
    const damagedDelta = input.movementType === "DAMAGE" ? Math.abs(input.difference) : 0;
    const incomingDelta =
      input.movementType === "INCOMING_STOCK" ? Math.max(0, input.difference) : 0;

    await tx.inventory.update({
      where: { id: inventory.id },
      data: {
        available: newQuantity,
        reserved: newReserved,
        sold: soldDelta ? { increment: soldDelta } : undefined,
        returned: returnedDelta ? { increment: returnedDelta } : undefined,
        damaged: damagedDelta ? { increment: damagedDelta } : undefined,
        incoming: incomingDelta ? { increment: incomingDelta } : undefined,
      },
    });
    await tx.product.update({
      where: { id: product.id },
      data: {
        stock: newQuantity,
        reservedStock: newReserved,
        stockStatus:
          newQuantity <= 0
            ? "OUT_OF_STOCK"
            : newQuantity <= product.lowStockThreshold
              ? "LOW_STOCK"
              : "IN_STOCK",
      },
    });

    return tx.inventoryMovement.create({
      data: movementData({
        inventoryId: inventory.id,
        variantId: null,
        previousQuantity,
        newQuantity,
        reservedBefore: previousReserved,
        reservedAfter: newReserved,
        input,
      }),
    });
  });
}

function movementData({
  inventoryId,
  variantId,
  previousQuantity,
  newQuantity,
  reservedBefore,
  reservedAfter,
  input,
}: {
  inventoryId: string;
  variantId: string | null;
  previousQuantity: number;
  newQuantity: number;
  reservedBefore: number;
  reservedAfter: number;
  input: Parameters<typeof adjustInventory>[0];
}): Prisma.InventoryMovementUncheckedCreateInput {
  return {
    inventoryId,
    variantId,
    movementType: input.movementType ?? "CORRECTION",
    previousQuantity,
    newQuantity,
    difference: input.difference,
    reservedBefore,
    reservedAfter,
    reason: input.reason,
    reference: input.reference || null,
    idempotencyKey: input.idempotencyKey || null,
    adminUserId: input.adminUserId,
    notes: input.notes,
  };
}
