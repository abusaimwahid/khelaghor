import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  Sale: "bg-coral/10 text-coral",
  New: "bg-teal/10 text-teal",
  Featured: "bg-sun/40 text-navy",
  Processing: "bg-orange/15 text-orange",
  Delivered: "bg-teal/10 text-teal",
  Pending: "bg-sun/40 text-navy",
  "Out of Stock": "bg-slate-200 text-slate-600",
};

export function StatusBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  const text = String(children);
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", toneMap[text] ?? "bg-navy/10 text-navy", className)}>
      {children}
    </span>
  );
}
