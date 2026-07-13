import { NextResponse } from "next/server";
import { handleSslCommerzCallback } from "@/server/payments/sslcommerz";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = Object.fromEntries(await request.formData()) as Record<
    string,
    string
  >;
  const result = await handleSslCommerzCallback("ipn", form);
  return NextResponse.json({ ok: result.ok });
}
