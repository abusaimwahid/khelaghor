"use client";

import Link from "next/link";
import { Grid2X2, Heart, Home, Search, UserRound } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/categories", label: "Categories", icon: Grid2X2 },
  { href: "/search", label: "Search", icon: Search },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account", label: "Account", icon: UserRound },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t border-[var(--border)] bg-white shadow-2xl md:hidden">
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="flex flex-col items-center gap-1 py-2 text-[11px] font-bold text-navy">
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
