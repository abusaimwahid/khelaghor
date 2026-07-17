import Link from "next/link";
import {
  CreditCard,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { NewsletterSignup } from "./newsletter-signup";
import { getSiteSettings } from "@/server/site-settings";
import { Logo } from "./logo";

const shop = [
  "Toys",
  "Books",
  "Clothing",
  "Baby Care",
  "School",
  "Gifts",
  "New Arrivals",
  "Best Sellers",
];
const service = [
  "Help Centre",
  "Track Order",
  "Shipping",
  "Returns",
  "Refunds",
  "Contact",
  "FAQ",
];
const company = ["About Us", "Blog", "Privacy Policy", "Terms and Conditions"];
const account = ["My Account", "Orders", "Wishlist", "Addresses", "Support"];
const policies = [
  "Shipping Policy",
  "Payment Policy",
  "Return and Refund Policy",
  "Cancellation Policy",
];

export async function Footer() {
  const settings = await getSiteSettings();
  const socialLinks = [
    ["Facebook", settings.social.facebook],
    ["Instagram", settings.social.instagram],
    ["YouTube", settings.social.youtube],
    ["TikTok", settings.social.tiktok],
    ["LinkedIn", settings.social.linkedin],
    ["WhatsApp", settings.social.whatsapp || settings.general.whatsappNumber],
  ].filter(([, href]) => href);
  return (
    <footer className="mt-20 border-t border-[var(--border)] bg-navy pb-20 text-white md:pb-0">
      <div className="border-b border-white/10">
        <div className="container grid gap-3 py-5 text-sm font-extrabold sm:grid-cols-3">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sun" /> Child-safe curation
          </span>
          <span className="inline-flex items-center gap-2">
            <Truck className="h-5 w-5 text-sun" /> Bangladesh-wide delivery
          </span>
          <span className="inline-flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-sun" /> COD and digital payments
          </span>
        </div>
      </div>
      <div className="container grid gap-8 py-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_1.3fr]">
        <section className="space-y-4">
          <Logo
            variant="light"
            storeName={settings.general.storeName}
            tagline={settings.general.tagline}
          />
          <p className="max-w-sm text-sm leading-6 text-white/75">
            {settings.general.businessDescription}
          </p>
          {socialLinks.length ? (
            <div className="flex flex-wrap gap-3 text-sm font-black">
              {socialLinks.map(([label, href]) => (
                <Link
                  key={label}
                  href={String(href)}
                  className="inline-flex items-center gap-1 hover:text-sun"
                >
                  {label}
                </Link>
              ))}
            </div>
          ) : null}
        </section>
        <FooterList title="Shop" items={shop} />
        <FooterList title="Customer Service" items={service} />
        <FooterList title="My Account" items={account} />
        <FooterList title="Company" items={company} />
        <FooterList title="Policies" items={policies} />
        <section className="space-y-4">
          <h2 className="font-black">Newsletter</h2>
          <NewsletterSignup compact />
          {settings.general.address ? (
            <p className="flex gap-2 text-sm text-white/75">
              <MapPin className="h-4 w-4 shrink-0" /> {settings.general.address}
            </p>
          ) : null}
          {settings.general.supportPhone ? (
            <p className="flex gap-2 text-sm text-white/75">
              <Phone className="h-4 w-4" /> {settings.general.supportPhone}
            </p>
          ) : null}
          {settings.general.supportEmail ? (
            <p className="flex gap-2 text-sm text-white/75">
              <Mail className="h-4 w-4" /> {settings.general.supportEmail}
            </p>
          ) : null}
          {settings.general.businessHours ? (
            <p className="text-sm text-white/75">
              {settings.general.businessHours}
            </p>
          ) : null}
          <p className="text-sm text-white/75">
            {[
              settings.commerce.codEnabled ? "COD" : null,
              settings.commerce.onlinePaymentEnabled ? "Online payments" : null,
            ]
              .filter(Boolean)
              .join(" • ") || "Payments disabled in local development"}
          </p>
          <p className="text-xs font-bold text-white/55">
            Delivery partner details will appear here after a courier provider is configured.
          </p>
        </section>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-sm text-white/70">
        © 2026 {settings.general.storeName}. All rights reserved.
      </div>
    </footer>
  );
}

function FooterList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2 className="mb-4 font-black">{title}</h2>
      <ul className="space-y-2 text-sm text-white/75">
        {items.map((item) => (
          <li key={item}>
            <Link
              href={footerHref(item)}
              className="hover:text-white"
            >
              {item}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function footerHref(item: string) {
  const map: Record<string, string> = {
    "My Account": "/account",
    Orders: "/account/orders",
    Wishlist: "/wishlist",
    Addresses: "/account/addresses",
    Support: "/account/support",
    Shipping: "/shipping-policy",
    Returns: "/return-and-refund-policy",
    Refunds: "/return-and-refund-policy",
    Contact: "/contact-us",
    FAQ: "/faq",
  };
  return map[item] ?? `/${item.toLowerCase().replaceAll(" ", "-")}`;
}
