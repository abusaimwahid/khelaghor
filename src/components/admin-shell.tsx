"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  Megaphone,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Logo } from "./logo";

const groups = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    items: [["Dashboard", "/admin"]],
  },
  {
    label: "Catalog",
    icon: Boxes,
    items: [
      ["Products", "/admin/products"],
      ["Categories", "/admin/categories"],
      ["Brands", "/admin/brands"],
      ["Inventory", "/admin/inventory"],
      ["Reviews", "/admin/reviews"],
    ],
  },
  {
    label: "Sales",
    icon: ClipboardList,
    items: [
      ["Orders", "/admin/orders"],
      ["Returns", "/admin/returns"],
      ["Refunds", "/admin/refunds"],
    ],
  },
  {
    label: "Marketing",
    icon: Megaphone,
    items: [
      ["Coupons", "/admin/coupons"],
      ["Banners", "/admin/banners"],
      ["Homepage CMS", "/admin/homepage"],
    ],
  },
  {
    label: "Operations",
    icon: UsersRound,
    items: [
      ["Support Tickets", "/admin/support"],
      ["Delivery Zones", "/admin/delivery-zones"],
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    items: [
      ["Reconciliation", "/admin/reports/reconciliation"],
      ["Content Quality", "/admin/reports/content-quality"],
    ],
  },
  {
    label: "System",
    icon: Settings,
    items: [
      ["Settings", "/admin/settings"],
      ["Legal Review", "/admin/legal-review"],
      ["Staff", "/admin/staff"],
      ["Development Emails", "/admin/development/emails"],
    ],
  },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="admin-ui min-h-screen bg-[#f4f6f9]">
      <div className="sticky top-0 z-30 border-b border-[#e3e8ef] bg-white/95 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-3 px-4 lg:pl-[292px] lg:pr-6">
          <details className="relative lg:hidden">
            <summary
              className="admin-icon-button"
              aria-label="Open admin navigation"
            >
              <Menu className="h-5 w-5" />
            </summary>
            <div className="fixed inset-x-3 top-16 max-h-[calc(100vh-5rem)] overflow-auto rounded-xl bg-navy p-4 text-white shadow-2xl">
              <AdminNavigation pathname={pathname} />
            </div>
          </details>
          <form
            action="/admin/products"
            className="relative hidden max-w-md flex-1 md:block"
          >
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              name="q"
              className="admin-input h-10 pl-9"
              placeholder="Search products and SKUs…"
              aria-label="Search admin"
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              className="admin-icon-button"
              aria-label="View storefront"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
            <button className="admin-icon-button" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            <Link
              href="/admin/products/new"
              className="admin-button admin-button-primary"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New product</span>
            </Link>
          </div>
        </div>
      </div>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col bg-[#0d2345] text-white shadow-xl lg:flex">
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Logo variant="light" />
          <ShieldCheck className="h-5 w-5 text-sun" />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <AdminNavigation pathname={pathname} />
        </div>
        <div className="border-t border-white/10 p-4 text-xs font-bold text-white/55">
          Secure operations workspace
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:ml-[272px] lg:p-8">
        {" "}
        <div className="mx-auto max-w-[1500px] space-y-6">{children}</div>
      </main>
    </div>
  );
}

function AdminNavigation({ pathname }: { pathname: string }) {
  return (
    <nav className="space-y-5" aria-label="Admin navigation">
      {groups.map((group) => {
        const Icon = group.icon;
        return (
          <section key={group.label}>
            <h2 className="mb-1.5 flex items-center gap-2 px-3 text-[11px] font-black uppercase tracking-[.12em] text-white/45">
              <Icon className="h-3.5 w-3.5" />
              {group.label}
            </h2>
            <div className="space-y-0.5">
              {group.items.map(([label, href]) => {
                const active =
                  href === "/admin"
                    ? pathname === href
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={label}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "flex items-center rounded-lg bg-white px-3 py-2.5 text-sm font-black text-navy shadow-sm"
                        : "flex items-center rounded-lg px-3 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
                    }
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </nav>
  );
}

export function AdminHero({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <div>
        <p className="admin-eyebrow">KhelaGhor Operations</p>
        <h1 className="admin-page-title">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
