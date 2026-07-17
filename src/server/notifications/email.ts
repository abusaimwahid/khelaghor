import { getEnv, getSiteUrl } from "@/server/env";
import { prisma } from "@/server/db";

export type EmailTemplate =
  | "registration"
  | "order-confirmation"
  | "payment-confirmation"
  | "order-shipped"
  | "order-delivered"
  | "password-reset"
  | "return-update"
  | "support-reply"
  | "review-moderation"
  | "refund-update";

export type EmailInput = {
  to: string;
  template: EmailTemplate;
  subject: string;
  data: Record<string, string | number | null | undefined>;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] ?? char,
  );
}

function renderEmail(input: EmailInput) {
  const siteUrl = getSiteUrl();
  const rows = Object.entries(input.data)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `<tr><td style="padding:6px 0;color:#64748b">${escapeHtml(key)}</td><td style="padding:6px 0;font-weight:700;color:#10264a">${escapeHtml(String(value))}</td></tr>`,
    )
    .join("");
  const plain = `${input.subject}\n\n${Object.entries(input.data)
    .map(([key, value]) => `${key}: ${value ?? ""}`)
    .join("\n")}\n\n${siteUrl}`;
  const html = `<!doctype html><html><body style="margin:0;background:#fff8ec;font-family:Arial,sans-serif;color:#17233f"><div style="max-width:620px;margin:auto;padding:32px"><h1 style="margin:0;color:#10264a">KhelaGhor</h1><h2 style="color:#10264a">${escapeHtml(input.subject)}</h2><table style="width:100%;border-collapse:collapse">${rows}</table><p style="margin-top:24px;color:#64748b">Visit <a href="${siteUrl}" style="color:#ff5c75">${siteUrl}</a></p></div></body></html>`;
  return { html, plain };
}

export async function sendEmail(input: EmailInput) {
  const env = getEnv();
  const rendered = renderEmail(input);
  if (env.EMAIL_PROVIDER === "dev") {
    console.info("[dev-email]", input.to, input.subject, rendered.plain);
    await prisma.developmentEmailLog
      .create({
        data: {
          recipient: input.to,
          subject: input.subject,
          template: input.template,
          relatedType:
            typeof input.data.relatedType === "string"
              ? input.data.relatedType
              : undefined,
          relatedId:
            typeof input.data.relatedId === "string"
              ? input.data.relatedId
              : undefined,
          preview: rendered.plain.slice(0, 4000),
        },
      })
      .catch(() => undefined);
    return { provider: "dev", sent: false };
  }
  if (env.EMAIL_PROVIDER === "resend") {
    if (!env.RESEND_API_KEY)
      throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend.");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: input.to,
        subject: input.subject,
        html: rendered.html,
        text: rendered.plain,
      }),
    });
    if (!response.ok) throw new Error("Email provider send failed.");
    return { provider: "resend", sent: true };
  }
  return { provider: env.EMAIL_PROVIDER, sent: false };
}
