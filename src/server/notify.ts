import { prisma } from "./db";
import { sendEmail, type EmailTemplate } from "./notifications/email";

const emailTemplatesByType: Record<string, EmailTemplate> = {
  USER_REGISTERED: "registration",
  ORDER_CREATED: "order-confirmation",
  PAYMENT_CONFIRMED: "payment-confirmation",
  ORDER_SHIPPED: "order-shipped",
  ORDER_DELIVERED: "order-delivered",
  PASSWORD_RESET: "password-reset",
  RETURN_UPDATED: "return-update",
  SUPPORT_UPDATED: "support-reply",
};

export async function notifyUser(input: {
  userId?: string | null;
  type: string;
  title: string;
  body: string;
  email?: string | null;
}) {
  if (input.userId) {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
      },
    });
  }
  const recipient =
    input.email ??
    (input.userId
      ? (
          await prisma.user.findUnique({
            where: { id: input.userId },
            select: { email: true },
          })
        )?.email
      : null);
  const template = emailTemplatesByType[input.type];
  if (recipient && template) {
    await sendEmail({
      to: recipient,
      template,
      subject: input.title,
      data: { message: input.body },
    }).catch((error) => {
      if (process.env.NODE_ENV !== "production")
        console.warn("[email-send-failed]", error);
    });
  }
  if (process.env.NODE_ENV !== "production") {
    console.info("[dev-notification]", input.type, input.title, input.body);
  }
}

export async function audit(input: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? undefined,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata:
        input.metadata === undefined
          ? undefined
          : JSON.parse(JSON.stringify(input.metadata)),
    },
  });
}
