import { prisma } from "./db";

export async function adjustInventory(input: { productId: string; variantId?: string | null; difference: number; reason: string; adminUserId?: string; notes?: string }) {
  return prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.upsert({
      where: { productId: input.productId },
      create: { productId: input.productId, available: 0 },
      update: {},
    });
    const previousQuantity = input.variantId
      ? (await tx.productVariant.findUniqueOrThrow({ where: { id: input.variantId } })).stock
      : inventory.available;
    const newQuantity = previousQuantity + input.difference;
    if (newQuantity < 0) throw new Error("Stock cannot be negative.");
    if (input.variantId) {
      await tx.productVariant.update({ where: { id: input.variantId }, data: { stock: newQuantity } });
    } else {
      await tx.inventory.update({ where: { id: inventory.id }, data: { available: newQuantity } });
      await tx.product.update({ where: { id: input.productId }, data: { stock: newQuantity } });
    }
    await tx.inventoryMovement.create({
      data: {
        inventoryId: inventory.id,
        variantId: input.variantId || null,
        previousQuantity,
        newQuantity,
        difference: input.difference,
        reason: input.reason,
        adminUserId: input.adminUserId,
        notes: input.notes,
      },
    });
    return newQuantity;
  });
}
