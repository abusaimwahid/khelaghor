import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Megaphone,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Logo } from "./logo";

const groups = [
  {
    label: "Operations",
    icon: ClipboardList,
    items: ["Dashboard", "Orders", "Returns", "Refunds", "Support Tickets"],
  },
  {
    label: "Catalog",
    icon: Boxes,
    items: ["Products", "Categories", "Brands", "Inventory", "Reviews"],
  },
  {
    label: "Growth",
    icon: Megaphone,
    items: [
      "Coupons",
      "Promotions",
      "Flash Sales",
      "Banners",
      "Newsletter Subscribers",
    ],
  },
  { label: "Insights", icon: BarChart3, items: ["Reports", "Activity Logs"] },
  {
    label: "People",
    icon: UsersRound,
    items: ["Customers", "Staff", "Roles", "Permissions"],
  },
  {
    label: "System",
    icon: Settings,
    items: ["Integrations", "Settings", "Pages", "Blog", "FAQs"],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="container grid gap-8 py-8 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-lg bg-navy p-5 text-white shadow-sm lg:sticky lg:top-28">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Logo variant="light" />
            <ShieldCheck className="h-5 w-5 shrink-0 text-sun" />
          </div>
          <nav className="max-h-[72vh] space-y-5 overflow-auto pr-1">
            {groups.map((group) => {
              const Icon = group.icon;
              return (
                <section key={group.label}>
                  <h2 className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-white/55">
                    <Icon className="h-4 w-4" /> {group.label}
                  </h2>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item}
                        href="/admin"
                        className="block rounded-md px-3 py-2 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white"
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 space-y-8">{children}</main>
      </div>
    </div>
  );
}

export function AdminHero({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="kg-card p-6">
      <p className="text-sm font-black uppercase text-teal">
        Role: Super Admin
      </p>
      <h1 className="mt-1 text-3xl font-black text-navy">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        {description}
      </p>
    </header>
  );
}
