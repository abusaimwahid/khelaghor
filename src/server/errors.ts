import { logServerEvent } from "./observability";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code = "APP_ERROR",
  ) {
    super(message);
  }
}

const safeMessages: Record<string, string> = {
  CART_EMPTY: "Your cart is empty.",
  STOCK_UNAVAILABLE: "The selected item is no longer available.",
  COUPON_INVALID: "The coupon could not be applied.",
  ORDER_FORBIDDEN: "We could not place your order. Please try again.",
  RATE_LIMITED: "Too many requests. Please wait a minute and try again.",
};

export function toSafeMessage(error: unknown) {
  if (error instanceof AppError)
    return safeMessages[error.code] ?? error.message;
  return "We could not place your order. Please try again.";
}

export function logInternalError(scope: string, error: unknown) {
  logServerEvent("error", "Internal error", {
    scope,
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : String(error),
  });
}
