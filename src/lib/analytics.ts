export type AnalyticsEvent =
  | "view_product"
  | "search"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase"
  | "coupon_use"
  | "registration";

export function trackEvent(
  event: AnalyticsEvent,
  payload: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
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
