import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { brands, categories, coupons, products } from "../src/data/catalog";
import { allDistrictIdsExcept } from "../src/data/bangladesh-locations";
import {
  defaultHomepageSettings,
  defaultSiteSettings,
} from "../src/server/site-settings";
import { resolveSeedPolicy } from "./seed-policy";

const prisma = new PrismaClient();

async function main() {
  const policy = resolveSeedPolicy(process.env);
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
    "dashboard.metrics",
    "products.images.manage",
    "products.variants.manage",
    "categories.manage",
    "brands.manage",
    "inventory.view",
    "inventory.adjust",
    "orders.payment.verify",
    "refunds.approve",
    "returns.review",
    "support.manage",
    "support.internal-notes",
    "reviews.moderate",
    "coupons.manage",
    "homepage.manage",
    "content.manage",
    "delivery-zones.manage",
    "courier.manage",
    "audit.view",
  ];
  if (policy.seedOperationalAccess) {
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

    const roleMatrix: Record<string, string[]> = {
      "Store Manager": [
        "dashboard.metrics",
        "products.view",
        "orders.view",
        "orders.update",
        "inventory.view",
        "customers.view",
        "reports.view",
        "coupons.manage",
        "returns.review",
        "support.manage",
        "reviews.moderate",
      ],
      "Product Manager": [
        "products.view",
        "products.create",
        "products.update",
        "products.images.manage",
        "products.variants.manage",
        "categories.manage",
        "brands.manage",
        "inventory.view",
      ],
      "Order Manager": [
        "orders.view",
        "orders.update",
        "orders.payment.verify",
        "returns.review",
        "courier.manage",
        "customers.view",
      ],
      "Warehouse Staff": [
        "products.view",
        "inventory.view",
        "inventory.adjust",
        "orders.view",
        "orders.update",
        "returns.review",
      ],
      "Customer Support": [
        "orders.view",
        "customers.view",
        "returns.review",
        "support.manage",
        "support.internal-notes",
        "reviews.moderate",
      ],
      "Content Manager": [
        "products.view",
        "homepage.manage",
        "content.manage",
        "reviews.moderate",
      ],
      Accountant: [
        "dashboard.metrics",
        "orders.view",
        "orders.payment.verify",
        "refunds.approve",
        "reports.view",
        "audit.view",
      ],
    };
    for (const [name, keys] of Object.entries(roleMatrix)) {
      const seededRole = await prisma.role.upsert({
        where: { name },
        update: {},
        create: { name, description: `${name} operational access` },
      });
      await prisma.rolePermission.deleteMany({
        where: { roleId: seededRole.id },
      });
      const assigned = all.filter((permission) =>
        keys.includes(permission.key),
      );
      if (assigned.length)
        await prisma.rolePermission.createMany({
          data: assigned.map((permission) => ({
            roleId: seededRole.id,
            permissionId: permission.id,
          })),
        });
    }

    if (policy.seedDevelopmentAdmin) {
      const adminEmail =
        process.env.SEED_ADMIN_EMAIL ?? "admin@khelaghor.local";
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
      console.log(`Seed complete. Development admin: ${adminEmail}`);
    } else {
      console.log(
        "Seed admin skipped. Run npm run admin:create with explicit credentials.",
      );
    }
  } else {
    console.log(
      "Staging operational access and admin seeding skipped. Run npm run admin:create separately.",
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
    const categoryBn: Record<string, string> = {
      toys: "খেলনা",
      books: "বই",
      clothing: "পোশাক",
      "baby-care": "শিশু যত্ন",
      "school-supplies": "স্কুল সামগ্রী",
      gifts: "উপহার",
    };
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { nameBn: categoryBn[category.slug] },
      create: {
        name: category.name,
        nameBn: categoryBn[category.slug],
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
    const productBn =
      product.slug === products[0]?.slug
        ? {
            name: "শিশুদের পছন্দের খেলনা",
            short: "খেলা ও শেখার জন্য যত্নে বাছাই করা পণ্য।",
            full: "নিরাপদ ও আনন্দময় খেলার মাধ্যমে শিশুর শেখা ও সৃজনশীলতাকে উৎসাহিত করে।",
          }
        : null;
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        nameBn: productBn?.name,
        shortDescriptionBn: productBn?.short,
        fullDescriptionBn: productBn?.full,
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
        nameBn: productBn?.name,
        slug: product.slug,
        sku: product.sku,
        shortDescription: product.description,
        shortDescriptionBn: productBn?.short,
        fullDescription: product.description,
        fullDescriptionBn: productBn?.full,
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
      update: {
        normalizedCode: coupon.code.toUpperCase(),
      },
      create: {
        code: coupon.code,
        normalizedCode: coupon.code.toUpperCase(),
        name: coupon.code,
        type: coupon.type,
        value: coupon.value,
        percentageValue: coupon.type === "PERCENT" ? coupon.value : undefined,
        fixedValue: coupon.type === "FREE_DELIVERY" ? coupon.value : undefined,
        minimumSpend: coupon.minimumSpend,
        minimumEligibleSubtotal: coupon.minimumSpend,
        maximumDiscount: coupon.maximumDiscount,
        active: true,
      },
    });
  if (policy.seedSiteSettings)
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
  if (policy.seedSiteSettings)
    await prisma.siteSetting.upsert({
      where: { key: "site" },
      update: {},
      create: {
        key: "site",
        value: defaultSiteSettings,
      },
    });
  if (policy.seedSiteSettings)
    await prisma.siteSetting.upsert({
      where: { key: "homepage" },
      update: {},
      create: {
        key: "homepage",
        value: defaultHomepageSettings,
      },
    });
  await seedDeliveryZones(policy);
  await seedCustomerTrustWorkflows(policy);
}

async function seedDeliveryZones(policy: ReturnType<typeof resolveSeedPolicy>) {
  const seededZoneIds: string[] = [];
  const createIfMissing = async (
    slug: string,
    data: Prisma.DeliveryZoneCreateInput,
  ) => {
    const existing = await prisma.deliveryZone.findUnique({ where: { slug } });
    if (existing) return existing;
    const created = await prisma.deliveryZone.create({ data });
    seededZoneIds.push(created.id);
    return created;
  };

  await createIfMissing("inside-dhaka-city", {
    name: "Inside Dhaka City",
    slug: "inside-dhaka-city",
    description: "Dhaka city core delivery areas.",
    deliveryFee: 60,
    freeDeliveryThreshold: 2500,
    minDeliveryDays: 1,
    maxDeliveryDays: 2,
    codAvailable: true,
    expressAvailable: true,
    expressFee: 120,
    sortOrder: 1,
    rules: {
      create: [
        {
          divisionId: "dhaka",
          districtId: "dhaka-dhaka",
          areaId: "dhaka-dhanmondi",
          priority: 100,
        },
        {
          divisionId: "dhaka",
          districtId: "dhaka-dhaka",
          areaId: "dhaka-gulshan",
          priority: 100,
        },
        {
          divisionId: "dhaka",
          districtId: "dhaka-dhaka",
          areaId: "dhaka-banani",
          priority: 100,
        },
        {
          divisionId: "dhaka",
          districtId: "dhaka-dhaka",
          areaId: "dhaka-mirpur",
          priority: 100,
        },
        {
          divisionId: "dhaka",
          districtId: "dhaka-dhaka",
          areaId: "dhaka-uttara",
          priority: 100,
        },
        { divisionId: "dhaka", districtId: "dhaka-dhaka", priority: 80 },
      ],
    },
  });
  await createIfMissing("dhaka-suburban", {
    name: "Dhaka Suburban",
    slug: "dhaka-suburban",
    description:
      "Savar, Keraniganj, Gazipur, Tongi and Narayanganj nearby delivery.",
    deliveryFee: 90,
    freeDeliveryThreshold: 3500,
    minDeliveryDays: 2,
    maxDeliveryDays: 3,
    codAvailable: true,
    expressAvailable: true,
    expressFee: 160,
    sortOrder: 2,
    rules: {
      create: [
        {
          divisionId: "dhaka",
          districtId: "dhaka-dhaka",
          areaId: "dhaka-savar",
          priority: 110,
        },
        {
          divisionId: "dhaka",
          districtId: "dhaka-dhaka",
          areaId: "dhaka-keraniganj",
          priority: 110,
        },
        { divisionId: "dhaka", districtId: "dhaka-gazipur", priority: 80 },
        { divisionId: "dhaka", districtId: "dhaka-narayanganj", priority: 80 },
      ],
    },
  });
  await createIfMissing("remote-area", {
    name: "Remote Area",
    slug: "remote-area",
    description: "Remote or hard-to-reach areas with longer delivery windows.",
    deliveryFee: 180,
    freeDeliveryThreshold: 6000,
    minDeliveryDays: 5,
    maxDeliveryDays: 9,
    codAvailable: false,
    expressAvailable: false,
    sortOrder: 3,
    rules: {
      create: [
        { remoteOnly: true, priority: 120 },
        {
          divisionId: "chattogram",
          districtId: "chattogram-bandarban",
          priority: 90,
        },
        {
          divisionId: "chattogram",
          districtId: "chattogram-rangamati",
          priority: 90,
        },
      ],
    },
  });
  await createIfMissing("outside-dhaka", {
    name: "Outside Dhaka",
    slug: "outside-dhaka",
    description:
      "Nationwide standard courier delivery outside Dhaka city and suburban zones.",
    deliveryFee: 130,
    freeDeliveryThreshold: 4500,
    minDeliveryDays: 3,
    maxDeliveryDays: 5,
    codAvailable: true,
    expressAvailable: false,
    fallback: true,
    sortOrder: 4,
    rules: {
      create: allDistrictIdsExcept([
        "dhaka-dhaka",
        "dhaka-gazipur",
        "dhaka-narayanganj",
      ]).map((districtId) => ({
        districtId,
        priority: 10,
      })),
    },
  });
  await createIfMissing("store-pickup", {
    name: "Store Pickup",
    slug: "store-pickup",
    description: "Pickup from KhelaGhor after order confirmation.",
    deliveryFee: 0,
    minDeliveryDays: 0,
    maxDeliveryDays: 1,
    codAvailable: true,
    expressAvailable: false,
    pickup: true,
    sortOrder: 5,
    rules: {
      create: [{ divisionId: "dhaka", districtId: "dhaka-dhaka", priority: 1 }],
    },
  });
  if (policy.environment !== "staging" && seededZoneIds.length > 0)
    await prisma.auditLog.create({
      data: {
        action: "delivery-zone.seed",
        entity: "DeliveryZone",
        entityId: seededZoneIds[0],
        metadata: { seeded: true, zoneIds: seededZoneIds },
      },
    });
}

async function seedCustomerTrustWorkflows(
  policy: ReturnType<typeof resolveSeedPolicy>,
) {
  const customerPassword =
    policy.environment === "development"
      ? "ChangeMe123!"
      : randomBytes(32).toString("base64url");
  const customer = await prisma.user.upsert({
    where: { email: "parent@khelaghor.local" },
    update: {},
    create: {
      email: "parent@khelaghor.local",
      name: "Seed Parent",
      phone: "+8801711111111",
      passwordHash: await bcrypt.hash(customerPassword, 12),
    },
  });
  const product = await prisma.product.findFirstOrThrow({
    where: { status: "PUBLISHED", archivedAt: null },
    include: { categories: true, brand: true },
  });
  const address = await prisma.address.upsert({
    where: { id: "seed-trust-address" },
    update: {},
    create: {
      id: "seed-trust-address",
      userId: customer.id,
      label: "Seed",
      name: "Seed Parent",
      phone: "+8801711111111",
      divisionId: "dhaka",
      districtId: "dhaka-dhaka",
      areaId: "dhaka-dhanmondi",
      division: "Dhaka",
      district: "Dhaka",
      area: "Dhanmondi",
      line1: "Seed House",
    },
  });
  const order = await prisma.order.upsert({
    where: { number: "KG-SEED-DELIVERED" },
    update: {
      status: "DELIVERED",
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    create: {
      number: "KG-SEED-DELIVERED",
      userId: customer.id,
      addressId: address.id,
      email: customer.email,
      phone: customer.phone,
      subtotal: 1000,
      discount: 0,
      deliveryFee: 60,
      total: 1060,
      status: "DELIVERED",
      paymentStatus: "PAID",
      deliveryMethod: "standard",
      paymentMethod: "COD",
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      items: {
        create: {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity: 1,
          unitPrice: 1000,
        },
      },
      statusHistory: {
        create: { toStatus: "DELIVERED", note: "Seed delivered order" },
      },
      payments: { create: { provider: "COD", status: "PAID", amount: 1060 } },
    },
    include: { items: true },
  });
  const orderItem =
    order.items[0] ??
    (await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } }));
  const trustCoupons = [
    {
      code: "EXPIRED10",
      name: "Expired 10%",
      type: "PERCENT" as const,
      value: 10,
      startsAt: new Date(Date.now() - 10 * 86400000),
      expiresAt: new Date(Date.now() - 86400000),
    },
    {
      code: "FIRSTORDER15",
      name: "First order 15%",
      type: "FIRST_ORDER" as const,
      value: 15,
      firstOrderOnly: true,
    },
    {
      code: "FREEDELIVERY",
      name: "Free delivery",
      type: "FREE_DELIVERY" as const,
      value: 0,
    },
    {
      code: "PRODUCT5",
      name: "Product specific 5%",
      type: "PRODUCT" as const,
      value: 5,
    },
  ];
  for (const coupon of trustCoupons) {
    const saved = await prisma.coupon.upsert({
      where: { normalizedCode: coupon.code },
      update: {},
      create: {
        code: coupon.code,
        normalizedCode: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        percentageValue: coupon.type === "FREE_DELIVERY" ? null : coupon.value,
        fixedValue: coupon.type === "FREE_DELIVERY" ? 0 : null,
        startsAt: coupon.startsAt,
        expiresAt: coupon.expiresAt,
        active: true,
        firstOrderOnly: Boolean(coupon.firstOrderOnly),
      },
    });
    if (coupon.code === "PRODUCT5") {
      await prisma.couponProduct.upsert({
        where: {
          couponId_productId: { couponId: saved.id, productId: product.id },
        },
        update: {},
        create: { couponId: saved.id, productId: product.id },
      });
    }
  }
  const existingReview = await prisma.review.findFirst({
    where: {
      OR: [
        { orderItemId: orderItem.id },
        { productId: product.id, userId: customer.id },
      ],
    },
  });
  if (existingReview) {
    await prisma.review.update({
      where: { id: existingReview.id },
      data: { status: "APPROVED", featured: true, verifiedPurchase: true },
    });
  } else {
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: customer.id,
        orderItemId: orderItem.id,
        rating: 5,
        title: "Loved by my child",
        text: "The quality feels great and delivery was smooth.",
        verifiedPurchase: true,
        status: "APPROVED",
        featured: true,
      },
    });
  }
  const returnRequest = await prisma.returnRequest.upsert({
    where: { number: "RET-SEED-REQUESTED" },
    update: {},
    create: {
      number: "RET-SEED-REQUESTED",
      orderId: order.id,
      userId: customer.id,
      reason: "Damaged product",
      description: "Seed return example",
      resolution: "Refund",
      items: { create: { orderItemId: orderItem.id, quantity: 1 } },
      history: {
        create: { toStatus: "REQUESTED", publicNote: "Seed return submitted." },
      },
    },
  });
  await prisma.refund.upsert({
    where: { number: "RF-SEED-PARTIAL" },
    update: {},
    create: {
      number: "RF-SEED-PARTIAL",
      orderId: order.id,
      returnRequestId: returnRequest.id,
      amount: 100,
      method: "MANUAL",
      status: "APPROVED",
      reason: "Seed partial refund",
    },
  });
  const ticket = await prisma.supportTicket.upsert({
    where: { number: "SUP-SEED-OPEN" },
    update: {},
    create: {
      number: "SUP-SEED-OPEN",
      userId: customer.id,
      category: "Order",
      priority: "NORMAL",
      subject: "Seed support ticket",
      messages: {
        create: {
          senderId: customer.id,
          body: "I need help with my order.",
          public: true,
        },
      },
      attachments: {
        create: {
          uploaderId: customer.id,
          url: "/uploads/support/seed.pdf",
          fileName: "seed.pdf",
          mimeType: "application/pdf",
          size: 0,
        },
      },
    },
  });
  const customerNotification = await prisma.notification.findFirst({
    where: {
      userId: customer.id,
      type: "COUPON_ISSUED",
      resourceType: "Coupon",
      resourceId: "FREEDELIVERY",
    },
  });
  if (!customerNotification)
    await prisma.notification.create({
      data: {
        userId: customer.id,
        type: "COUPON_ISSUED",
        title: "Coupon issued",
        body: "Try FREEDELIVERY on your next eligible order.",
        resourceType: "Coupon",
        resourceId: "FREEDELIVERY",
        href: "/checkout",
      },
    });
  const adminNotification = await prisma.notification.findFirst({
    where: {
      userId: null,
      type: "ADMIN_SUPPORT_TICKET",
      resourceType: "SupportTicket",
      resourceId: ticket.id,
    },
  });
  if (!adminNotification)
    await prisma.notification.create({
      data: {
        type: "ADMIN_SUPPORT_TICKET",
        title: "New support ticket",
        body: ticket.subject,
        resourceType: "SupportTicket",
        resourceId: ticket.id,
        href: `/admin/support/${ticket.id}`,
      },
    });
  if (policy.seedDevelopmentEmail) {
    const emailLog = await prisma.developmentEmailLog.findFirst({
      where: {
        recipient: customer.email,
        template: "support-reply",
        relatedType: "SupportTicket",
        relatedId: ticket.id,
      },
    });
    if (!emailLog)
      await prisma.developmentEmailLog.create({
        data: {
          recipient: customer.email,
          subject: "Seed workflow email",
          template: "support-reply",
          relatedType: "SupportTicket",
          relatedId: ticket.id,
          preview: "Seed development email preview.",
        },
      });
  }
}

main().finally(async () => prisma.$disconnect());
