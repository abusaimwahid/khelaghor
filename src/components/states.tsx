import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, PackageSearch } from "lucide-react";

type StateProps = {
  title: string;
  description: string;
  href?: string;
  action?: string;
  icon?: LucideIcon;
};

export function EmptyState({
  title,
  description,
  href,
  action,
  icon: Icon = PackageSearch,
}: StateProps) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-cream p-8 text-center">
      <Icon className="mx-auto h-10 w-10 text-coral" />
      <h2 className="mt-4 text-xl font-black text-navy">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {description}
      </p>
      {href && action ? (
        <Link href={href} className="kg-button kg-button-primary mt-5">
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
}: Omit<StateProps, "href" | "action" | "icon">) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <strong className="block">{title}</strong>
          <p className="mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function SuccessState({
  title,
  description,
}: Omit<StateProps, "href" | "action" | "icon">) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
      <div className="flex gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <strong className="block">{title}</strong>
          <p className="mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}
