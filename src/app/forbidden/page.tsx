import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <section className="container storefront-page grid min-h-[520px] place-items-center">
      <div className="storefront-surface max-w-xl p-8 text-center md:p-12">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-coral/10 text-coral">
          <ShieldAlert className="h-10 w-10" />
        </span>
        <p className="storefront-eyebrow mt-6">Access restricted</p>
        <h1 className="mt-2 text-3xl font-black text-navy">
          Permission required
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Your account does not have permission to open this area. If this
          appears incorrect, contact a Super Admin.
        </p>
        <Link href="/account" className="kg-button kg-button-primary mt-6">
          Return to your account
        </Link>
      </div>
    </section>
  );
}
