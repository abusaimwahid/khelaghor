import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json(
    { ok: false, message: "Checkout is handled by the server action so idempotency, cart ownership and stock validation are enforced." },
    { status: 405 },
  );
}
