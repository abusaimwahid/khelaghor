import Link from "next/link";
import {
  Heart,
  Bell,
  Menu,
  Search,
  ShoppingCart,
  UserRound,
  Headphones,
} from "lucide-react";
import { AnnouncementRotator } from "./announcement-rotator";
import { Logo } from "./logo";
import { MarketplaceNav } from "./marketplace-nav";
import { listCategories } from "@/server/catalog";
import { prisma } from "@/server/db";
import { currentUser, readGuestCartToken } from "@/server/security";
import {
  activeHomepageItems,
  getHomepageSettings,
  getSiteSettings,
} from "@/server/site-settings";
import { money } from "@/lib/utils";
import { getLocale, localizedPath, messages as getMessages } from "@/lib/i18n";

export async function Header() {
  const [settings, homepage, categories, user, locale] = await Promise.all([
    getSiteSettings(),
    getHomepageSettings(),
    listCategories(),
    currentUser(),
    getLocale(),
  ]);
  const t = getMessages(locale);
  const [cartCount, wishlistCount, notificationCount] = await Promise.all([
    getCartCount(user?.id),
    user
      ? prisma.wishlistItem.count({ where: { wishlist: { userId: user.id } } })
      : Promise.resolve(0),
    user
      ? prisma.notification.count({ where: { userId: user.id, readAt: null } })
      : Promise.resolve(0),
  ]);
  const announcement = homepage.announcementBar;
  const configuredMessages = activeHomepageItems(
    homepage.announcementMessages.map((message) => ({
      ...message,
      sortOrder: message.priority,
    })),
  ).map((message) => message.message);
  const messages = configuredMessages.length
    ? configuredMessages
    : [
        announcement.title,
        announcement.subtitle,
        settings.commerce.codEnabled ? "Cash on Delivery available" : "",
        settings.commerce.freeDeliveryThreshold > 0
          ? `Free delivery over ${money(settings.commerce.freeDeliveryThreshold)}`
          : "",
        settings.general.supportPhone
          ? `Support: ${settings.general.supportPhone}`
          : "",
        announcement.highlightedText,
      ].filter(Boolean);
  const navCategories = selectCategoriesByIds(
    categories,
    homepage.navigation.topCategoryIds,
    12,
  );
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 shadow-[var(--shadow-sm)] backdrop-blur-xl">
      {announcement.enabled && messages.length ? (
        <div className="bg-navy text-white">
          <div className="container grid h-9 grid-cols-1 items-center gap-3 text-xs font-bold md:grid-cols-[1fr_auto]">
            <AnnouncementRotator messages={messages} />
            {settings.general.supportPhone ? (
              <span className="hidden items-center gap-2 md:inline-flex">
                <Headphones className="h-3.5 w-3.5 text-sun" />
                {settings.general.supportPhone}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="container grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4 py-3 lg:grid-cols-[220px_1fr_auto]">
        <div className="flex items-center gap-2">
          <button
            className="focus-ring grid h-11 w-11 place-items-center rounded-[var(--radius-control)] border border-[var(--border)] bg-white transition hover:border-coral hover:bg-[var(--surface-peach)] lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo
            storeName={settings.general.storeName}
            tagline={settings.general.tagline}
            href={localizedPath("/", locale)}
          />
        </div>
        <form
          action="/search"
          className="hidden h-12 min-w-0 overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface-soft)] transition focus-within:border-coral focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(255,92,117,.1)] md:flex"
        >
          <select
            name="category"
            aria-label="Search category"
            className="w-44 border-r border-[var(--border)] bg-white px-4 text-sm font-black text-navy outline-none"
            defaultValue=""
          >
            <option value="">{t.global.allCategories}</option>
            {navCategories.slice(0, 12).map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            name="q"
            className="min-w-0 flex-1 px-4 outline-none"
            placeholder="Search toys, books, baby care, school supplies..."
            aria-label={t.global.search}
          />
          <button
            className="grid w-14 place-items-center bg-coral text-white transition hover:bg-[#f44765]"
            aria-label={t.global.search}
          >
            <Search className="h-5 w-5" />
          </button>
        </form>
        <nav className="ml-auto flex items-center gap-2">
          <Link
            href={locale === "bn" ? "/?locale=en" : "/bn"}
            hrefLang={locale === "bn" ? "en" : "bn"}
            className="focus-ring grid min-h-11 min-w-11 place-items-center rounded-xl border border-[var(--border)] px-2 text-sm font-black text-navy transition hover:border-coral hover:text-coral"
            aria-label={locale === "bn" ? "Switch to English" : "বাংলায় দেখুন"}
          >
            {locale === "bn" ? "EN" : "বাংলা"}
          </Link>
          <Link
            href={user ? "/account" : "/login"}
            className="focus-ring hidden h-11 items-center gap-2 rounded-xl px-3 font-black text-navy transition hover:bg-[var(--surface-soft)] md:inline-flex"
          >
            <UserRound className="h-5 w-5" />
            {user?.name?.split(" ")[0] ?? t.global.account}
          </Link>
          <CountLink
            href={localizedPath("/wishlist", locale)}
            label={t.global.wishlist}
            count={wishlistCount}
          >
            <Heart className="h-5 w-5" />
          </CountLink>
          {user ? (
            <CountLink
              href={localizedPath("/account/notifications", locale)}
              label={t.global.notifications}
              count={notificationCount}
            >
              <Bell className="h-5 w-5" />
            </CountLink>
          ) : null}
          <CountLink
            href={localizedPath("/cart", locale)}
            label={t.global.cart}
            count={cartCount}
            dark
          >
            <ShoppingCart className="h-5 w-5" />
          </CountLink>
        </nav>
      </div>
      <form
        action="/search"
        className="container mb-3 flex h-12 overflow-hidden rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-soft)] focus-within:border-coral focus-within:bg-white md:hidden"
      >
        <input
          name="q"
          className="min-w-0 flex-1 px-3 outline-none"
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
      <MarketplaceNav
        categories={navCategories.map((category) => ({
          name: category.name,
          slug: category.slug,
          image: category.image,
          children: category.children.map((child) => ({
            name: child.name,
            slug: child.slug,
          })),
        }))}
      />
    </header>
  );
}

function selectCategoriesByIds<T extends { id: string }>(
  categories: T[],
  ids: string[],
  take: number,
) {
  const selected = ids
    .map((id) => categories.find((category) => category.id === id))
    .filter(Boolean) as T[];
  const seen = new Set(selected.map((category) => category.id));
  return [
    ...selected,
    ...categories.filter((category) => !seen.has(category.id)),
  ].slice(0, take);
}

async function getCartCount(userId?: string) {
  if (userId) {
    const item = await prisma.cartItem.aggregate({
      where: { cart: { userId } },
      _sum: { quantity: true },
    });
    return item._sum.quantity ?? 0;
  }
  const guestToken = await readGuestCartToken();
  if (!guestToken) return 0;
  const item = await prisma.cartItem.aggregate({
    where: { cart: { guestToken } },
    _sum: { quantity: true },
  });
  return item._sum.quantity ?? 0;
}

function CountLink({
  href,
  label,
  count,
  dark = false,
  children,
}: {
  href: string;
  label: string;
  count: number;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        dark
          ? "focus-ring relative grid h-11 w-11 place-items-center rounded-xl bg-navy text-white shadow-sm transition hover:-translate-y-0.5"
          : "focus-ring relative grid h-11 w-11 place-items-center rounded-xl border border-[var(--border)] bg-white text-navy transition hover:border-coral hover:bg-[var(--surface-soft)]"
      }
      aria-label={`${label}${count ? `, ${count} items` : ""}`}
    >
      {children}
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-coral px-1 text-[11px] font-black leading-5 text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
