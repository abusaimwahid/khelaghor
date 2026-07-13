import crypto from "node:crypto";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { getEnv, getSiteUrl } from "@/server/env";
import { audit } from "@/server/notify";

type SslCommerzInitResponse = {
  status: string;
  GatewayPageURL?: string;
  sessionkey?: string;
  failedreason?: string;
};

type CallbackPayload = Record<string, string>;

function endpoint(
  path: "gwprocess/v4/api.php" | "validator/api/validationserverAPI.php",
) {
  const env = getEnv();
  const host =
    env.SSLCOMMERZ_MODE === "live"
      ? "https://securepay.sslcommerz.com"
      : "https://sandbox.sslcommerz.com";
  return `${host}/${path}`;
}

function redactPayload(payload: CallbackPayload) {
  const redacted = { ...payload };
  for (const key of Object.keys(redacted)) {
    if (/card|bank|token|password|store_passwd/i.test(key))
      redacted[key] = "[redacted]";
  }
  return redacted;
}

export async function createSslCommerzSession(orderId: string) {
  const env = getEnv();
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { address: true, payments: true },
  });
  if (env.SSLCOMMERZ_MODE === "mock") {
    return {
      redirectUrl: `${getSiteUrl()}/order-confirmation?order=${order.number}&payment=mock-pending`,
      sessionKey: "mock-session",
    };
  }
  if (!env.SSLCOMMERZ_STORE_ID || !env.SSLCOMMERZ_STORE_PASSWORD) {
    throw new Error("SSLCommerz credentials are required.");
  }
  const payment =
    order.payments[0] ??
    (await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "SSLCOMMERZ",
        status: PaymentStatus.PENDING,
        amount: order.total,
      },
    }));
  const base = getSiteUrl();
  const form = new URLSearchParams({
    store_id: env.SSLCOMMERZ_STORE_ID,
    store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
    total_amount: Number(order.total).toFixed(2),
    currency: "BDT",
    tran_id: order.number,
    success_url: `${base}/api/payments/sslcommerz/success`,
    fail_url: `${base}/api/payments/sslcommerz/failure`,
    cancel_url: `${base}/api/payments/sslcommerz/cancel`,
    ipn_url: `${base}/api/payments/sslcommerz/ipn`,
    product_name: `KhelaGhor order ${order.number}`,
    product_category: "children-ecommerce",
    product_profile: "general",
    cus_name: order.address?.name ?? "KhelaGhor Customer",
    cus_email: order.email ?? "customer@khelaghor.local",
    cus_add1: order.address?.line1 ?? "Bangladesh",
    cus_city: order.address?.district ?? "Dhaka",
    cus_state: order.address?.division ?? "Dhaka",
    cus_postcode: order.address?.postalCode ?? "1200",
    cus_country: "Bangladesh",
    cus_phone: order.phone ?? order.address?.phone ?? "01700000000",
    ship_name: order.address?.name ?? "KhelaGhor Customer",
    ship_add1: order.address?.line1 ?? "Bangladesh",
    ship_city: order.address?.district ?? "Dhaka",
    ship_state: order.address?.division ?? "Dhaka",
    ship_postcode: order.address?.postalCode ?? "1200",
    ship_country: "Bangladesh",
  });
  const response = await fetch(endpoint("gwprocess/v4/api.php"), {
    method: "POST",
    body: form,
  });
  if (!response.ok) throw new Error("SSLCommerz session creation failed.");
  const body = (await response.json()) as SslCommerzInitResponse;
  await prisma.paymentTransaction.create({
    data: {
      paymentId: payment.id,
      type: "SSLCOMMERZ_SESSION_CREATED",
      verified: body.status === "SUCCESS",
      payload: {
        status: body.status,
        sessionkey: body.sessionkey,
        failedreason: body.failedreason,
      },
    },
  });
  if (body.status !== "SUCCESS" || !body.GatewayPageURL)
    throw new Error(
      body.failedreason || "SSLCommerz gateway URL was not returned.",
    );
  return { redirectUrl: body.GatewayPageURL, sessionKey: body.sessionkey };
}

function validateCallbackSignature(payload: CallbackPayload) {
  const env = getEnv();
  const verifySign = payload.verify_sign;
  const verifyKeys = payload.verify_key?.split(",").filter(Boolean) ?? [];
  if (!verifySign || !verifyKeys.length || !env.SSLCOMMERZ_STORE_PASSWORD)
    return false;
  const values = verifyKeys
    .sort()
    .map((key) => `${key}=${payload[key] ?? ""}`)
    .join("&");
  const signature = crypto
    .createHash("md5")
    .update(`${values}&store_passwd=${env.SSLCOMMERZ_STORE_PASSWORD}`)
    .digest("hex");
  return signature === verifySign;
}

async function verifyWithSslCommerz(payload: CallbackPayload) {
  const env = getEnv();
  if (env.SSLCOMMERZ_MODE === "mock")
    return payload.status === "VALID" || payload.status === "VALIDATED";
  if (
    !env.SSLCOMMERZ_STORE_ID ||
    !env.SSLCOMMERZ_STORE_PASSWORD ||
    !payload.val_id
  )
    return false;
  const params = new URLSearchParams({
    val_id: payload.val_id,
    store_id: env.SSLCOMMERZ_STORE_ID,
    store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
    format: "json",
  });
  const response = await fetch(
    `${endpoint("validator/api/validationserverAPI.php")}?${params.toString()}`,
    { method: "GET" },
  );
  if (!response.ok) return false;
  const body = (await response.json()) as {
    status?: string;
    tran_id?: string;
    amount?: string;
    currency?: string;
  };
  return (
    ["VALID", "VALIDATED"].includes(body.status ?? "") &&
    body.tran_id === payload.tran_id
  );
}

export async function handleSslCommerzCallback(
  type: "success" | "failure" | "cancel" | "ipn",
  payload: CallbackPayload,
) {
  const orderNumber = payload.tran_id;
  const order = orderNumber
    ? await prisma.order.findUnique({
        where: { number: orderNumber },
        include: { payments: true },
      })
    : null;
  if (!order)
    return { ok: false, redirect: "/payment/failure?reason=order-not-found" };
  const payment =
    order.payments.find((row) => row.provider === "SSLCOMMERZ") ??
    (await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "SSLCOMMERZ",
        status: PaymentStatus.PENDING,
        amount: order.total,
      },
    }));

  const signatureValid = validateCallbackSignature(payload);
  const gatewayVerified =
    type === "success" || type === "ipn"
      ? await verifyWithSslCommerz(payload)
      : false;
  await prisma.paymentTransaction.create({
    data: {
      paymentId: payment.id,
      type: `SSLCOMMERZ_${type.toUpperCase()}`,
      verified: signatureValid && gatewayVerified,
      payload: redactPayload(payload),
    },
  });

  if (type === "failure" || type === "cancel") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        reference: payload.bank_tran_id ?? payload.val_id,
      },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: PaymentStatus.FAILED },
    });
    return { ok: false, redirect: `/payment/failure?order=${order.number}` };
  }

  if (!signatureValid || !gatewayVerified)
    return {
      ok: false,
      redirect: `/payment/failure?order=${order.number}&reason=verification`,
    };
  if (payment.status !== PaymentStatus.PAID) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          reference: payload.bank_tran_id ?? payload.val_id,
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.PAYMENT_CONFIRMED,
        },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.PAYMENT_CONFIRMED,
          note: "SSLCommerz payment verified",
        },
      }),
    ]);
    await audit({
      action: "payment.verified",
      entity: "Order",
      entityId: order.id,
      metadata: { provider: "SSLCOMMERZ", order: order.number },
    });
  }
  return { ok: true, redirect: `/order-confirmation?order=${order.number}` };
}
