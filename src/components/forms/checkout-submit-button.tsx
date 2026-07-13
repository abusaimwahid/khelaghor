"use client";

import { useFormStatus } from "react-dom";

export function CheckoutSubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="mt-8 rounded-md bg-coral px-6 py-3 font-black text-white disabled:bg-slate-300" disabled={disabled || pending}>
      {pending ? "Placing order..." : "Place Order"}
    </button>
  );
}
