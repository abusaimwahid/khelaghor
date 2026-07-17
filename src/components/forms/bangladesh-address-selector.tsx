"use client";

import { useMemo, useState } from "react";
import type { Division } from "@/data/bangladesh-locations";
import { money } from "@/lib/utils";

type Quote = {
  zoneName: string;
  deliveryFee: number;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  codAvailable: boolean;
  expressAvailable: boolean;
  freeDeliveryApplied: boolean;
};

export function BangladeshAddressSelector({
  divisions,
}: {
  divisions: Division[];
}) {
  const [divisionId, setDivisionId] = useState("dhaka");
  const [districtId, setDistrictId] = useState("dhaka-dhaka");
  const [areaId, setAreaId] = useState("dhaka-dhanmondi");
  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const districts = useMemo(
    () => divisions.find((division) => division.id === divisionId)?.districts ?? [],
    [divisions, divisionId],
  );
  const areas = useMemo(
    () => districts.find((district) => district.id === districtId)?.areas ?? [],
    [districts, districtId],
  );

  async function requestQuote(next: {
    divisionId?: string;
    districtId?: string;
    areaId?: string;
    deliveryMethod?: string;
    paymentMethod?: string;
  } = {}) {
    const payload = {
      divisionId: next.divisionId ?? divisionId,
      districtId: next.districtId ?? districtId,
      areaId: next.areaId ?? areaId,
      deliveryMethod: next.deliveryMethod ?? deliveryMethod,
      paymentMethod: next.paymentMethod ?? paymentMethod,
    };
    if (!payload.divisionId || !payload.districtId || !payload.areaId) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/checkout/delivery-quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { ok: boolean; quote?: Quote; message?: string };
      if (body.ok && body.quote) {
        setQuote(body.quote);
        setMessage("");
      } else {
        setQuote(null);
        setMessage(body.message || "Delivery quote is not available.");
      }
    } catch {
      setQuote(null);
      setMessage("Delivery quote is not available.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="font-bold text-navy">
          Division
          <select
            name="divisionId"
            value={divisionId}
            required
            className="kg-input mt-2"
            onChange={(event) => {
              const nextDivisionId = event.target.value;
              const nextDivision = divisions.find((division) => division.id === nextDivisionId);
              const nextDistrictId = nextDivision?.districts[0]?.id ?? "";
              const nextAreaId = nextDivision?.districts[0]?.areas[0]?.id ?? "";
              setDivisionId(nextDivisionId);
              setDistrictId(nextDistrictId);
              setAreaId(nextAreaId);
              void requestQuote({ divisionId: nextDivisionId, districtId: nextDistrictId, areaId: nextAreaId });
            }}
          >
            {divisions.map((division) => (
              <option key={division.id} value={division.id}>
                {division.name}
              </option>
            ))}
          </select>
        </label>
        <label className="font-bold text-navy">
          District
          <select
            name="districtId"
            value={districtId}
            required
            className="kg-input mt-2"
            onChange={(event) => {
              const nextDistrictId = event.target.value;
              const nextDistrict = districts.find((district) => district.id === nextDistrictId);
              const nextAreaId = nextDistrict?.areas[0]?.id ?? "";
              setDistrictId(nextDistrictId);
              setAreaId(nextAreaId);
              void requestQuote({ districtId: nextDistrictId, areaId: nextAreaId });
            }}
          >
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </label>
        <label className="font-bold text-navy">
          Area / Thana
          <select
            name="areaId"
            value={areaId}
            required
            className="kg-input mt-2"
            onChange={(event) => {
              setAreaId(event.target.value);
              void requestQuote({ areaId: event.target.value });
            }}
          >
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
        <label className="font-bold text-navy">
          Postal code
          <input
            name="postalCode"
            defaultValue={areas.find((area) => area.id === areaId)?.postalCode ?? ""}
            className="kg-input mt-2"
          />
        </label>
        <label className="font-bold text-navy">
          Landmark
          <input name="landmark" className="kg-input mt-2" />
        </label>
        <label className="font-bold text-navy md:col-span-2">
          Full address
          <textarea name="address" required className="kg-input mt-2 min-h-28" />
        </label>
      </div>

      <h2 className="mb-3 mt-8 text-xl font-black text-navy">Delivery Method</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {[
          ["standard", "Standard Delivery"],
          ["express", "Express Delivery"],
          ["pickup", "Store Pickup"],
        ].map(([value, label]) => (
          <label
            key={value}
            className="flex gap-3 rounded-md border border-[var(--border)] p-4 font-bold text-navy"
          >
            <input
              type="radio"
              name="deliveryMethod"
              value={value}
              checked={deliveryMethod === value}
              onChange={() => {
                setDeliveryMethod(value);
                void requestQuote({ deliveryMethod: value });
              }}
            />
            {label}
          </label>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-xl font-black text-navy">Payment</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {[
          ["COD", "Cash on Delivery"],
          ["SSLCOMMERZ", "SSLCommerz online payment"],
          ["BKASH", "bKash placeholder"],
          ["NAGAD", "Nagad placeholder"],
          ["ROCKET", "Rocket placeholder"],
          ["CARD", "Card payment placeholder"],
        ].map(([value, label]) => (
          <label
            key={value}
            className="flex gap-3 rounded-md border border-[var(--border)] p-4 font-bold text-navy"
          >
            <input
              type="radio"
              name="paymentMethod"
              value={value}
              checked={paymentMethod === value}
              onChange={() => {
                setPaymentMethod(value);
                void requestQuote({ paymentMethod: value });
              }}
            />
            {label}
          </label>
        ))}
      </div>

      <div
        role="status"
        className="mt-5 rounded-lg border border-[var(--border)] bg-cream p-4 text-sm font-bold text-navy"
      >
        {loading ? "Calculating delivery..." : null}
        {!loading && quote ? (
          <div className="grid gap-2 md:grid-cols-2">
            <p>Zone: {quote.zoneName}</p>
            <p>Delivery fee: {money(quote.deliveryFee)}</p>
            <p>
              Estimate: {quote.estimatedMinDays}-{quote.estimatedMaxDays} days
            </p>
            <p>{quote.codAvailable ? "COD available" : "COD unavailable"}</p>
            <p>{quote.expressAvailable ? "Express available" : "Express unavailable"}</p>
            {quote.freeDeliveryApplied ? <p>Free delivery applied.</p> : null}
          </div>
        ) : null}
        {!loading && message ? <p className="text-coral">{message}</p> : null}
        {!quote && !loading && !message ? (
          <button
            type="button"
            className="rounded-md bg-navy px-4 py-2 font-black text-white"
            onClick={() => void requestQuote()}
          >
            Calculate delivery
          </button>
        ) : null}
      </div>
    </>
  );
}
