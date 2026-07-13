import Link from "next/link";

type LogoVariant = "default" | "light" | "compact" | "admin";

export function Logo({ variant = "default" }: { variant?: LogoVariant }) {
  const light = variant === "light";
  const compact = variant === "compact";
  return (
    <Link
      href="/"
      className={`flex min-w-0 items-center gap-2 ${light ? "text-white" : "text-navy"}`}
      aria-label="KhelaGhor home"
    >
      <LogoMark />
      {!compact ? (
        <span className="min-w-0 leading-tight">
          <strong className="block truncate text-xl font-black tracking-normal">
            KhelaGhor
          </strong>
          <span
            className={`block truncate text-xs font-semibold ${light ? "text-white/70" : "text-teal"}`}
          >
            Play • Smile • Learn
          </span>
        </span>
      ) : null}
    </Link>
  );
}

export function LogoMark() {
  return (
    <span
      className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-coral text-white shadow-sm"
      aria-hidden="true"
    >
      <span className="absolute inset-x-0 bottom-0 h-4 bg-orange/80" />
      <svg viewBox="0 0 44 44" className="relative h-9 w-9" role="img">
        <path
          d="M10 21.8 22 11l12 10.8v12.5a1.7 1.7 0 0 1-1.7 1.7H11.7a1.7 1.7 0 0 1-1.7-1.7V21.8Z"
          fill="currentColor"
          opacity=".96"
        />
        <path
          d="M18.4 19.4c0-1.3 1.4-2.1 2.5-1.4l8 4.8c1.1.7 1.1 2.2 0 2.9l-8 4.8c-1.1.7-2.5-.1-2.5-1.4v-9.7Z"
          fill="#10264a"
        />
        <circle cx="13.7" cy="14.2" r="3.2" fill="#ffd166" />
      </svg>
    </span>
  );
}
