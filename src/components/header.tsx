import Link from "next/link";
import {
  Heart,
  Menu,
  Search,
  ShoppingCart,
  UserRound,
  Phone,
  ChevronDown,
  X,
} from "lucide-react";
import { categories } from "@/data/catalog";
import { Logo } from "./logo";

const navItems = [
  "Home",
  "Shop",
  "Categories",
  "New Arrivals",
  "Best Sellers",
  "Offers",
  "Brands",
  "Blog",
  "About Us",
  "Contact Us",
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="bg-navy text-white">
        <div className="container flex h-9 items-center justify-between text-xs font-semibold">
          <span className="truncate">
            Delivery across Bangladesh • Free delivery over ৳3,000 • First
            order: WELCOME10
          </span>
          <span className="hidden items-center gap-2 md:flex">
            <Phone className="h-3.5 w-3.5" /> Support: +880 1XXX-XXXXXX
          </span>
        </div>
      </div>
      <div className="container flex min-h-20 items-center gap-4 py-3">
        <Logo />
        <form
          action="/search"
          className="hidden flex-1 overflow-hidden rounded-lg border border-[var(--border)] bg-cream md:flex"
        >
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 border-r border-[var(--border)] px-4 text-sm font-bold text-navy"
          >
            Categories <ChevronDown className="h-4 w-4" />
          </Link>
          <input
            name="q"
            className="min-w-0 flex-1 bg-transparent px-4 outline-none"
            placeholder="Search toys, books, baby care..."
            aria-label="Search products"
          />
          <button
            className="grid w-12 place-items-center bg-coral text-white"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        </form>
        <nav className="ml-auto flex items-center gap-2">
          <Link
            href="/login"
            className="focus-ring hidden h-10 items-center gap-2 rounded-md px-3 font-bold text-navy md:inline-flex"
          >
            <UserRound className="h-5 w-5" /> Account
          </Link>
          <Link
            href="/wishlist"
            className="focus-ring grid h-10 w-10 place-items-center rounded-md border border-[var(--border)]"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            className="focus-ring grid h-10 w-10 place-items-center rounded-md bg-navy text-white"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
          </Link>
        </nav>
      </div>
      <nav className="container hidden h-12 items-center gap-6 text-sm font-extrabold text-navy lg:flex">
        {navItems.map((item) => (
          <Link
            key={item}
            href={
              item === "Home"
                ? "/"
                : `/${item.toLowerCase().replaceAll(" ", "-")}`
            }
            className="hover:text-coral"
          >
            {item}
          </Link>
        ))}
        <div className="group relative">
          <button className="inline-flex items-center gap-1 text-teal">
            Mega Menu <ChevronDown className="h-4 w-4" />
          </button>
          <div className="invisible absolute left-0 top-8 grid w-[720px] grid-cols-4 gap-4 rounded-lg border border-[var(--border)] bg-white p-5 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="rounded-md p-3 hover:bg-cream"
              >
                <strong>{category.name}</strong>
                <span className="mt-1 block text-xs font-semibold text-slate-500">
                  {category.children.join(", ")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <details className="container mb-3 lg:hidden">
        <summary className="focus-ring flex h-11 items-center justify-between rounded-lg border border-[var(--border)] bg-white px-3 font-extrabold text-navy">
          <span className="inline-flex items-center gap-2">
            <Menu className="h-5 w-5" /> Menu
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-slate-500">
            <X className="hidden h-4 w-4 open:inline" /> Browse
          </span>
        </summary>
        <div className="mt-2 grid gap-2 rounded-lg border border-[var(--border)] bg-white p-3 shadow-lg">
          {navItems.map((item) => (
            <Link
              key={item}
              href={
                item === "Home"
                  ? "/"
                  : `/${item.toLowerCase().replaceAll(" ", "-")}`
              }
              className="rounded-md px-3 py-2 font-bold text-navy hover:bg-cream"
            >
              {item}
            </Link>
          ))}
        </div>
      </details>
      <form
        action="/search"
        className="container mb-3 flex overflow-hidden rounded-lg border border-[var(--border)] bg-cream md:hidden"
      >
        <input
          name="q"
          className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
          placeholder="Search KhelaGhor"
          aria-label="Search products"
        />
        <button
          className="grid w-12 place-items-center bg-coral text-white"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>
    </header>
  );
}
