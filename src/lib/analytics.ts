export type AnalyticsEvent =
  | "view_product"
  | "search"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase"
  | "coupon_use"
  | "registration";

const emittedPurchases = new Set<string>();

export function trackEvent(
  event: AnalyticsEvent,
  payload: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  if (event === "purchase") {
    const orderId = typeof payload.orderId === "string" ? payload.orderId : "";
    if (!orderId || emittedPurchases.has(orderId)) return;
    emittedPurchases.add(orderId);
  }
  window.dispatchEvent(
    new CustomEvent("khelaghor:analytics", { detail: { event, payload } }),
  );
  const maybeWindow = window as typeof window & {
    gtag?: (
      type: "event",
      event: string,
      payload: Record<string, unknown>,
    ) => void;
    fbq?: (
      type: "trackCustom",
      event: string,
      payload: Record<string, unknown>,
    ) => void;
    dataLayer?: unknown[];
  };
  maybeWindow.gtag?.("event", event, payload);
  maybeWindow.fbq?.("trackCustom", event, payload);
  maybeWindow.dataLayer?.push({ event, ...payload });
}
