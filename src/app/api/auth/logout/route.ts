import { redirect } from "next/navigation";
import { destroySession } from "@/server/security";

export async function POST() {
  await destroySession();
  redirect("/");
}
