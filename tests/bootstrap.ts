import { PrismaClient } from "@prisma/client";
import {
  defaultHomepageSettings,
  defaultSiteSettings,
} from "../src/server/site-settings";

const permissions = [
  "*",
  "products.view",
  "products.create",
  "products.update",
  "orders.view",
  "orders.update",
  "customers.view",
  "reports.view",
  "inventory.view",
  "inventory.adjust",
  "staff.manage",
] as const;

const roles: Record<string, readonly string[]> = {
  "Super Admin": ["*"],
  "Store Manager": [
    "products.view",
    "orders.view",
    "orders.update",
    "customers.view",
    "reports.view",
  ],
  "Product Manager": [
    "products.view",
    "products.create",
    "products.update",
    "inventory.view",
  ],
  "Order Manager": ["orders.view", "orders.update", "customers.view"],
  "Warehouse Staff": [
    "products.view",
    "inventory.view",
    "inventory.adjust",
    "orders.view",
  ],
  "Customer Support": ["orders.view", "customers.view"],
  "Content Manager": ["products.view"],
  Accountant: ["orders.view", "reports.view"],
};

export async function bootstrapTestDatabase(prisma = new PrismaClient()) {
  try {
    for (const key of permissions)
      await prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key },
      });

    const permissionRows = await prisma.permission.findMany({
      where: { key: { in: [...permissions] } },
    });
    for (const [name, keys] of Object.entries(roles)) {
      const role = await prisma.role.upsert({
        where: { name },
        update: { description: `${name} test reference role` },
        create: { name, description: `${name} test reference role` },
      });
      for (const permission of permissionRows.filter((row) =>
        keys.includes(row.key),
      ))
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: { roleId: role.id, permissionId: permission.id },
        });
    }

    await upsertDeliveryZone(prisma, "test-reference-dhaka", {
      name: "Test Reference Dhaka",
      deliveryFee: 60,
      minDeliveryDays: 1,
      maxDeliveryDays: 2,
      codAvailable: true,
      expressAvailable: true,
      expressFee: 120,
      sortOrder: 1000,
    });
    await upsertDeliveryZone(prisma, "test-reference-fallback", {
      name: "Test Reference Fallback",
      deliveryFee: 130,
      minDeliveryDays: 3,
      maxDeliveryDays: 5,
      codAvailable: true,
      expressAvailable: false,
      fallback: true,
      sortOrder: 1001,
    });

    for (const setting of [
      {
        key: "store",
        value: {
          brand: "KhelaGhor Test",
          currency: "BDT",
          freeDeliveryThreshold: 3000,
        },
      },
      { key: "site", value: defaultSiteSettings },
      { key: "homepage", value: defaultHomepageSettings },
    ])
      await prisma.siteSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      });

    const products = await prisma.product.findMany({
      select: { id: true, stock: true },
    });
    for (const product of products)
      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: {},
        create: {
          productId: product.id,
          available: product.stock,
          reserved: 0,
        },
      });
  } finally {
    await prisma.$disconnect();
  }
}

async function upsertDeliveryZone(
  prisma: PrismaClient,
  slug: string,
  data: Omit<
    Parameters<typeof prisma.deliveryZone.upsert>[0]["create"],
    "slug"
  >,
) {
  await prisma.deliveryZone.upsert({
    where: { slug },
    update: data,
    create: { slug, ...data },
  });
}
