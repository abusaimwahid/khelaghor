import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { assertRateLimit } from "@/server/security";

export async function POST(request: Request) {
  try {
    await assertRateLimit("newsletter", 10);
    const form = await request.formData();
    const email = String(form.get("email") ?? "");
    if (!email.includes("@")) return NextResponse.json({ ok: false, message: "Valid email required" }, { status: 400 });
    await prisma.newsletterSubscriber.upsert({ where: { email }, update: { status: "ACTIVE" }, create: { email } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "Newsletter signup is temporarily unavailable." }, { status: 503 });
  }
}
