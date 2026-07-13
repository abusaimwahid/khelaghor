import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { brands, categories, coupons, products } from "../src/data/catalog";

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    "*",
    "products.view",
    "products.create",
    "products.update",
    "products.delete",
    "orders.view",
    "orders.update",
    "customers.view",
    "reports.view",
    "settings.update",
    "staff.manage",
  ];
  for (const key of permissions)
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key },
    });
  const role = await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: {},
    create: { name: "Super Admin", description: "Full platform access" },
  });
  const all = await prisma.permission.findMany();
  for (const permission of all)
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: role.id, permissionId: permission.id },
      },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });

  const shouldSeedAdmin =
    process.env.NODE_ENV !== "production" ||
    process.env.CREATE_SEED_ADMIN === "true";
  if (shouldSeedAdmin) {
    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@khelaghor.local";
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: "Development Super Admin",
        passwordHash: await bcrypt.hash(adminPassword, 12),
        phone: "+8801000000000",
        forcePasswordChange: process.env.NODE_ENV === "production",
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: role.id } },
      update: {},
      create: { userId: admin.id, roleId: role.id },
    });
    console.log(`Seed complete. Admin: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(
      "Seed complete. Production admin seeding skipped. Run npm run admin:create with explicit credentials.",
    );
  }

  const brandRows = new Map<string, string>();
  for (const name of brands) {
    const row = await prisma.brand.upsert({
      where: { slug: name.toLowerCase().replaceAll(" ", "-") },
      update: {},
      create: {
        name,
        slug: name.toLowerCase().replaceAll(" ", "-"),
        featured: true,
      },
    });
    brandRows.set(name, row.id);
  }
  const categoryRows = new Map<string, string>();
  for (const category of categories) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        featured: true,
      },
    });
    categoryRows.set(category.slug, row.id);
    for (const child of category.children) {
      await prisma.category.upsert({
        where: {
          slug: `${category.slug}-${child.toLowerCase().replaceAll(" ", "-")}`,
        },
        update: {},
        create: {
          name: child,
          slug: `${category.slug}-${child.toLowerCase().replaceAll(" ", "-")}`,
          parentId: row.id,
        },
      });
    }
  }
  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        sku: product.sku,
        shortDescription: product.description,
        fullDescription: product.description,
        status: "PUBLISHED",
        brandId: brandRows.get(product.brand),
        ageGroup: product.age,
        gender: product.gender,
        regularPrice: product.price,
        salePrice: product.salePrice,
        stock: product.stock,
        reservedStock: 0,
        featured: product.badges.includes("Featured"),
        inventory: {
          upsert: {
            create: { available: product.stock, sold: product.reviews },
            update: { available: product.stock, reserved: 0 },
          },
        },
      },
      create: {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        shortDescription: product.description,
        fullDescription: product.description,
        status: "PUBLISHED",
        brandId: brandRows.get(product.brand),
        ageGroup: product.age,
        gender: product.gender,
        regularPrice: product.price,
        salePrice: product.salePrice,
        stock: product.stock,
        featured: product.badges.includes("Featured"),
        images: { create: [{ url: product.image, alt: product.name }] },
        inventory: {
          create: { available: product.stock, sold: product.reviews },
        },
      },
    });
    const categoryId = categoryRows.get(product.category);
    if (categoryId)
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: created.id, categoryId } },
        update: {},
        create: { productId: created.id, categoryId },
      });
  }
  for (const coupon of coupons)
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minimumSpend: coupon.minimumSpend,
        maximumDiscount: coupon.maximumDiscount,
        active: true,
      },
    });
  await prisma.siteSetting.upsert({
    where: { key: "store" },
    update: {},
    create: {
      key: "store",
      value: {
        brand: "KhelaGhor",
        currency: "BDT",
        freeDeliveryThreshold: 3000,
      },
    },
  });
}

main().finally(async () => prisma.$disconnect());
