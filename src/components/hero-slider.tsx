"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export type HeroSlide = {
  title: string;
  subtitle: string;
  highlightedText?: string;
  description?: string;
  image?: string | null;
  mobileImage?: string | null;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  background: string;
  alignment?: "left" | "center" | "right";
  overlayStrength?: number;
  durationMs?: number;
};

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const current = slides[index] ?? slides[0];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % slides.length);
    }, current?.durationMs ?? 5200);
    return () => window.clearInterval(timer);
  }, [current?.durationMs, slides.length]);

  if (!current) return null;

  function move(direction: -1 | 1) {
    setIndex((value) => (value + direction + slides.length) % slides.length);
  }

  return (
    <section
      className="relative isolate grid min-h-[390px] overflow-hidden rounded-[24px] p-6 text-white shadow-[0_20px_55px_rgba(16,38,74,.12)] md:min-h-[450px] md:grid-cols-[1.08fr_0.92fr] md:p-10 lg:p-12"
      style={{ background: current.background || "var(--navy)" }}
      aria-roledescription="carousel"
    >
      <div
        className={
          current.alignment === "center"
            ? "relative z-10 flex max-w-xl flex-col justify-center text-center md:items-center"
            : current.alignment === "right"
              ? "relative z-10 flex max-w-xl flex-col justify-center text-right md:items-end"
              : "relative z-10 flex max-w-xl flex-col justify-center"
        }
      >
        <span className="mb-4 w-fit rounded-full border border-white/30 bg-white/20 px-4 py-2 text-xs font-black uppercase tracking-wide backdrop-blur">
          {current.highlightedText || "Featured offer"}
        </span>
        <h1 className="max-w-2xl text-4xl font-black leading-[1.04] tracking-[-0.035em] md:text-6xl">
          {current.title}
        </h1>
        <p className="mt-5 max-w-lg text-base font-semibold leading-7 text-white/85 md:text-lg">
          {current.subtitle}
        </p>
        {current.description ? (
          <p className="mt-2 max-w-lg text-xs font-semibold leading-5 text-white/70 md:text-sm">
            {current.description}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={current.primaryHref}
            className="focus-ring rounded-xl bg-coral px-6 py-3.5 font-black text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            {current.primaryLabel}
          </Link>
          <Link
            href={current.secondaryHref}
            className="focus-ring rounded-xl bg-white px-6 py-3.5 font-black text-navy shadow-lg shadow-black/5 transition hover:-translate-y-0.5"
          >
            {current.secondaryLabel}
          </Link>
        </div>
      </div>
      <div className="relative hidden items-center justify-center md:flex">
        {current.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.image}
            alt=""
            className="max-h-[390px] w-full object-contain drop-shadow-[0_25px_35px_rgba(16,38,74,.18)] transition duration-700 hover:scale-[1.03]"
          />
        ) : (
          <div className="grid aspect-square w-64 place-items-center rounded-full bg-white/15 text-center text-lg font-black">
            KhelaGhor
            <br />
            Picks
          </div>
        )}
      </div>
      {slides.length > 1 ? (
        <div className="absolute bottom-5 right-5 z-20 flex gap-2">
          <button
            type="button"
            className="focus-ring grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur transition hover:bg-white hover:text-navy"
            aria-label="Previous slide"
            onClick={() => move(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="focus-ring grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur transition hover:bg-white hover:text-navy"
            aria-label="Next slide"
            onClick={() => move(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
