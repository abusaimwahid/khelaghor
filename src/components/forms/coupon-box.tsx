"use client";

import { useState } from "react";
import { money } from "@/lib/utils";

type CouponPreview = {
  message: string;
  eligibleSubtotal: number;
  orderDiscount: number;
  deliveryDiscount: number;
  finalCouponDiscount: number;
};

export function CouponBox() {
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<CouponPreview | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function previewCoupon(nextCode = code) {
    if (!nextCode.trim()) {
      setPreview(null);
      setMessage("");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/checkout/coupon-preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: nextCode,
          paymentMethod: selectedPaymentMethod(),
        }),
      });
      const body = (await response.json()) as {
        ok: boolean;
        result?: CouponPreview;
        message?: string;
      };
      if (!body.ok || !body.result)
        throw new Error(body.message || "Coupon could not be applied.");
      setPreview(body.result);
      setMessage(body.result.message);
    } catch (error) {
      setPreview(null);
      setMessage(
        error instanceof Error ? error.message : "Coupon could not be applied.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label className="font-bold text-navy">
        Coupon
        <div className="mt-2 flex gap-2">
          <input
            name="couponCode"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setPreview(null);
            }}
            onBlur={() => void previewCoupon()}
            placeholder="WELCOME10"
            className="kg-input"
          />
          <button
            type="button"
            onClick={() => void previewCoupon()}
            className="rounded-md bg-navy px-4 font-black text-white"
          >
            {loading ? "..." : "Apply"}
          </button>
          {code ? (
            <button
              type="button"
              onClick={() => {
                setCode("");
                setPreview(null);
                setMessage("");
              }}
              className="rounded-md border px-4 font-black"
            >
              Remove
            </button>
          ) : null}
        </div>
      </label>
      {message ? (
        <p
          className={
            preview
              ? "mt-2 text-sm font-bold text-teal"
              : "mt-2 text-sm font-bold text-coral"
          }
        >
          {message}
        </p>
      ) : null}
      {preview ? (
        <div className="mt-2 rounded-md bg-cream p-3 text-xs font-bold text-slate-600">
          <p>Eligible subtotal: {money(preview.eligibleSubtotal)}</p>
          <p>Order discount: {money(preview.orderDiscount)}</p>
          {preview.deliveryDiscount ? (
            <p>Delivery discount: {money(preview.deliveryDiscount)}</p>
          ) : null}
          <p>Total coupon discount: {money(preview.finalCouponDiscount)}</p>
        </div>
      ) : null}
    </div>
  );
}

function selectedPaymentMethod() {
  const checked = document.querySelector<HTMLInputElement>(
    'input[name="paymentMethod"]:checked',
  );
  return checked?.value ?? "COD";
}
