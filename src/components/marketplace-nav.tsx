"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Grid3X3, X } from "lucide-react";

export type NavCategory = {
  name: string;
  slug: string;
  image?: string | null;
  children: { name: string; slug: string }[];
};

const featuredLinks = [
  ["Toys", "/shop?category=toys"],
  ["Learning & Education", "/shop?q=learning"],
  ["Baby Care", "/shop?q=baby-care"],
  ["Kids Fashion", "/shop?q=fashion"],
  ["Books", "/shop?q=books"],
  ["School Supplies", "/shop?q=school"],
  ["Outdoor Play", "/shop?q=outdoor"],
  ["Gifts", "/shop?q=gifts"],
  ["New Arrivals", "/new-arrivals"],
  ["Offers", "/offers"],
] as const;

export function MarketplaceNav({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <nav className="border-t border-[var(--border)] bg-white" ref={menuRef}>
      <div className="container hidden h-12 items-center gap-6 overflow-hidden text-sm font-black text-navy lg:flex">
        <button
          type="button"
          className="focus-ring inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-navy px-5 text-white shadow-md transition hover:bg-[#17355f]"
          aria-expanded={open}
          aria-controls="category-mega-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <Grid3X3 className="h-4 w-4" />
          All Categories
          <ChevronDown className="h-4 w-4" />
        </button>
        {featuredLinks.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className="shrink-0 transition hover:text-coral"
          >
            {label}
          </Link>
        ))}
      </div>
      {open ? (
        <div
          id="category-mega-menu"
          className="absolute left-1/2 z-50 hidden w-[min(1240px,calc(100vw-32px))] -translate-x-1/2 rounded-b-[20px] border border-t-0 border-[var(--border)] bg-white p-6 shadow-2xl lg:block"
        >
          <div className="grid gap-5 lg:grid-cols-[260px_1fr_240px]">
            <div className="space-y-1 border-r border-[var(--border)] pr-4">
              {categories.slice(0, 10).map((category) => (
                <Link
                  key={category.slug}
                  href={`/categories/${category.slug}`}
                  className="flex items-center justify-between rounded-md px-3 py-2 font-black text-navy hover:bg-cream"
                  onClick={() => setOpen(false)}
                >
                  {category.name}
                  <ChevronDown className="h-4 w-4 -rotate-90 text-slate-400" />
                </Link>
              ))}
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {categories.slice(0, 6).map((category) => (
                <section key={category.slug}>
                  <Link
                    href={`/categories/${category.slug}`}
                    onClick={() => setOpen(false)}
                    className="font-black text-navy hover:text-coral"
                  >
                    {category.name}
                  </Link>
                  <div className="mt-3 grid gap-2 text-sm font-bold text-slate-600">
                    {category.children.slice(0, 6).map((child) => (
                      <Link
                        key={child.slug}
                        href={`/categories/${child.slug}`}
                        onClick={() => setOpen(false)}
                        className="hover:text-navy"
                      >
                        {child.name}
                      </Link>
                    ))}
                    <Link
                      href={`/categories/${category.slug}`}
                      onClick={() => setOpen(false)}
                      className="text-coral"
                    >
                      View all
                    </Link>
                  </div>
                </section>
              ))}
            </div>
            <Link
              href="/offers"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-cream p-5"
            >
              <span className="rounded-full bg-sun px-3 py-1 text-xs font-black text-navy">
                Featured
              </span>
              <h2 className="mt-4 text-2xl font-black text-navy">
                Curated picks for every age
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Explore safe toys, baby care, learning kits and gift-ready
                bundles from database categories.
              </p>
            </Link>
          </div>
        </div>
      ) : null}
      <details className="container pb-2 lg:hidden">
        <summary className="focus-ring flex h-11 items-center justify-between rounded-xl border border-[var(--border)] bg-white px-4 font-black text-navy">
          <span className="inline-flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Browse categories
          </span>
          <X className="hidden h-4 w-4 open:block" />
        </summary>
        <div className="mt-2 max-h-[70vh] overflow-auto rounded-lg border border-[var(--border)] bg-white p-3 shadow-lg">
          {categories.map((category) => (
            <details
              key={category.slug}
              className="border-b border-[var(--border)] py-2"
            >
              <summary className="font-black text-navy">
                {category.name}
              </summary>
              <div className="mt-2 grid gap-2 pl-3 text-sm font-bold text-slate-600">
                <Link href={`/categories/${category.slug}`}>View all</Link>
                {category.children.map((child) => (
                  <Link key={child.slug} href={`/categories/${child.slug}`}>
                    {child.name}
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </div>
      </details>
    </nav>
  );
}
