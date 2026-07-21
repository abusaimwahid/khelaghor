import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  Sale: "bg-coral/10 text-coral",
  New: "bg-teal/10 text-teal",
  Featured: "bg-sun/40 text-navy",
  Processing: "bg-orange/15 text-orange",
  Delivered: "bg-teal/10 text-teal",
  Pending: "bg-sun/40 text-navy",
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  PROCESSING: "bg-sky-100 text-sky-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  REQUESTED: "bg-amber-100 text-amber-800",
  UNDER_REVIEW: "bg-violet-100 text-violet-800",
  REJECTED: "bg-red-100 text-red-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-200 text-slate-700",
  REFUNDED: "bg-violet-100 text-violet-800",
  OPEN: "bg-sky-100 text-sky-800",
  CLOSED: "bg-slate-200 text-slate-700",
  URGENT: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-800",
  NORMAL: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  UPCOMING: "bg-sky-100 text-sky-800",
  EXPIRED: "bg-slate-200 text-slate-700",
  INACTIVE: "bg-slate-200 text-slate-700",
  ARCHIVED: "bg-slate-200 text-slate-700",
  "Out of Stock": "bg-slate-200 text-slate-600",
};

export function StatusBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  const text = String(children);
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold leading-none", toneMap[text] ?? "bg-navy/10 text-navy", className)}>
      {children}
    </span>
  );
}
