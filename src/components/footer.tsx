import Link from "next/link";
import {
  CreditCard,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";
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
const company = [
  "About Us",
  "Blog",
  "Careers",
  "Privacy Policy",
  "Terms and Conditions",
];

export function Footer() {
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
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.3fr]">
        <section className="space-y-4">
          <Logo variant="light" />
          <p className="max-w-sm text-sm leading-6 text-white/75">
            KhelaGhor helps Bangladeshi parents discover safe, joyful and
            educational products for every stage of childhood.
          </p>
          <div className="flex gap-2 text-sm font-black">
            <span>Facebook</span>
            <span>Instagram</span>
            <span>YouTube</span>
          </div>
        </section>
        <FooterList title="Shop" items={shop} />
        <FooterList title="Customer Service" items={service} />
        <FooterList title="Company" items={company} />
        <section className="space-y-4">
          <h2 className="font-black">Newsletter</h2>
          <form className="flex overflow-hidden rounded-md bg-white">
            <input
              type="email"
              required
              placeholder="Email address"
              aria-label="Newsletter signup"
              className="min-w-0 flex-1 px-3 py-3 text-navy outline-none"
            />
            <button className="bg-coral px-4 font-extrabold">Join</button>
          </form>
          <p className="flex gap-2 text-sm text-white/75">
            <MapPin className="h-4 w-4 shrink-0" /> Dhaka, Bangladesh showroom
            placeholder
          </p>
          <p className="flex gap-2 text-sm text-white/75">
            <Phone className="h-4 w-4" /> +880 1XXX-XXXXXX
          </p>
          <p className="flex gap-2 text-sm text-white/75">
            <Mail className="h-4 w-4" /> hello@khelaghor.example
          </p>
          <p className="text-sm text-white/75">
            COD • bKash • Nagad • Rocket • Visa • Mastercard
          </p>
        </section>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-sm text-white/70">
        © 2026 KhelaGhor. All rights reserved.
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
              href={`/${item.toLowerCase().replaceAll(" ", "-")}`}
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
