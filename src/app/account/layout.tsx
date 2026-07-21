import Link from "next/link";
import { requireUser } from "@/server/security";

const links = [
  ["Overview", "/account"],
  ["Orders", "/account/orders"],
  ["Wishlist", "/account/wishlist"],
  ["Addresses", "/account/addresses"],
  ["Reviews", "/account/reviews"],
  ["Returns", "/account/returns"],
  ["Support", "/account/support"],
  ["Notifications", "/account/notifications"],
  ["Security", "/account/security"],
] as const;

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="container storefront-page">
      <div className="mb-6 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface-lavender)] p-6 md:p-8">
        <p className="storefront-eyebrow">Your KhelaGhor</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-navy md:text-4xl">Welcome back, {user.name?.split(" ")[0] ?? "friend"}</h1>
        <p className="mt-2 text-sm text-slate-600">Manage your orders, saved details and family picks in one place.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Account navigation" className="h-fit rounded-[var(--radius-panel)] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-sm)] lg:sticky lg:top-32">
          <div className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="whitespace-nowrap rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-black text-slate-600 transition hover:bg-[var(--surface-peach)] hover:text-navy lg:block">
                {label}
              </Link>
            ))}
          </div>
          <form action="/api/auth/logout" method="post" className="mt-3 border-t border-[var(--border)] pt-3">
            <button className="w-full rounded-[var(--radius-control)] px-3 py-2.5 text-left text-sm font-black text-slate-500 transition hover:bg-red-50 hover:text-red-600">Log out</button>
          </form>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
