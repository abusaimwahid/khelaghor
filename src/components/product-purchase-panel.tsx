"use client";

import { useState } from "react";
import { Heart, Share2, ShoppingCart } from "lucide-react";
import { addToCartAction } from "@/app/actions/cart";
import { money } from "@/lib/utils";

type VariantOption = {
  id: string;
  label: string;
  sku: string;
  stock: number;
  reservedStock: number;
  active: boolean;
  image: string | null;
  price: number | null;
  salePrice: number | null;
};

export function ProductPurchasePanel({
  productId,
  basePrice,
  baseSalePrice,
  baseStock,
  baseImage,
  variants,
}: {
  productId: string;
  basePrice: number;
  baseSalePrice: number | null;
  baseStock: number;
  baseImage: string;
  variants: VariantOption[];
}) {
  const availableVariants = variants.filter((variant) => variant.active);
  const [variantId, setVariantId] = useState("");
  const selected = availableVariants.find(
    (variant) => variant.id === variantId,
  );
  const currentPrice = selected?.price ?? basePrice;
  const currentSalePrice = selected?.salePrice ?? baseSalePrice;
  const currentStock = selected
    ? Math.max(0, selected.stock - selected.reservedStock)
    : baseStock;
  const currentImage = selected?.image || baseImage;
  const unavailable = currentStock <= 0;
  const maxQuantity = Math.max(1, Math.min(99, currentStock));
  const selectedLabel = selected?.label || "Default product";
  return (
    <form id="add-to-cart" action={addToCartAction} className="space-y-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={variantId} />
      <div className="grid gap-4 rounded-lg bg-white p-5 shadow-sm md:grid-cols-[120px_1fr]">
        <div className="aspect-square overflow-hidden rounded-md bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage}
            alt={selectedLabel}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-bold text-slate-500">{selectedLabel}</p>
            <div className="mt-1 flex items-end gap-3">
              <strong className="text-3xl text-coral">
                {money(currentSalePrice ?? currentPrice)}
              </strong>
              {currentSalePrice ? (
                <span className="text-lg text-slate-500 line-through">
                  {money(currentPrice)}
                </span>
              ) : null}
            </div>
            <p
              className={
                unavailable
                  ? "mt-2 text-sm font-bold text-slate-500"
                  : "mt-2 text-sm font-bold text-teal"
              }
            >
              {unavailable ? "Out of stock" : `${currentStock} available`}
            </p>
          </div>
          {availableVariants.length ? (
            <fieldset>
              <legend className="font-bold text-navy">Variant</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-md border border-[var(--border)] p-3 font-bold text-navy">
                  <input
                    type="radio"
                    name="variantChoice"
                    checked={variantId === ""}
                    onChange={() => setVariantId("")}
                  />
                  Default
                </label>
                {availableVariants.map((variant) => {
                  const variantStock = Math.max(
                    0,
                    variant.stock - variant.reservedStock,
                  );
                  return (
                    <label
                      key={variant.id}
                      className="flex items-center gap-2 rounded-md border border-[var(--border)] p-3 font-bold text-navy has-[:disabled]:bg-slate-100 has-[:disabled]:text-slate-400"
                    >
                      <input
                        type="radio"
                        name="variantChoice"
                        checked={variantId === variant.id}
                        disabled={variantStock <= 0}
                        onChange={() => setVariantId(variant.id)}
                      />
                      <span>
                        {variant.label}
                        <span className="block text-xs text-slate-500">
                          {variantStock > 0
                            ? `${variantStock} available`
                            : "Unavailable"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
          <label className="block font-bold text-navy">
            Quantity
            <input
              name="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              defaultValue="1"
              className="mt-2 w-full rounded-md border border-[var(--border)] p-3"
            />
          </label>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          className="inline-flex h-12 items-center gap-2 rounded-md bg-coral px-6 font-black text-white disabled:bg-slate-300"
          disabled={unavailable}
        >
          <ShoppingCart /> Add to Cart
        </button>
        <button
          className="inline-flex h-12 items-center gap-2 rounded-md bg-navy px-6 font-black text-white disabled:bg-slate-300"
          disabled={unavailable}
        >
          Buy Now
        </button>
        <button
          type="button"
          className="grid h-12 w-12 place-items-center rounded-md border border-[var(--border)] bg-white"
          aria-label="Add to wishlist"
        >
          <Heart />
        </button>
        <button
          type="button"
          className="grid h-12 w-12 place-items-center rounded-md border border-[var(--border)] bg-white"
          aria-label="Share product"
        >
          <Share2 />
        </button>
      </div>
    </form>
  );
}
