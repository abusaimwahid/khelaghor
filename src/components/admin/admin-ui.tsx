import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function AdminStat({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  icon?: LucideIcon;
}) {
  return (
    <article className="admin-stat">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <strong className="mt-2 block text-2xl tracking-tight text-navy">
            {value}
          </strong>
          {detail ? (
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {detail}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-navy">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
    </article>
  );
}

export function AdminSection({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="admin-section">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div>
          <h2 className="admin-section-title">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          ) : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
