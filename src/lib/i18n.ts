import { headers } from "next/headers";
import en from "@/messages/en.json";
import bn from "@/messages/bn.json";

export const locales = ["en", "bn"] as const;
export type Locale = (typeof locales)[number];

export async function getLocale(): Promise<Locale> {
  return (await headers()).get("x-khelaghor-locale") === "bn" ? "bn" : "en";
}

export function messages(locale: Locale) {
  return locale === "bn" ? bn : en;
}

export function localizedPath(path: string, locale: Locale) {
  const clean = path.startsWith("/bn") ? path.slice(3) || "/" : path;
  return locale === "bn" ? `/bn${clean === "/" ? "" : clean}` : clean;
}

export function localize<T>(english: T, bangla: T | null | undefined, locale: Locale): T {
  return locale === "bn" && bangla ? bangla : english;
}

export function formatMoney(value: number, locale: Locale) {
  const number = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    maximumFractionDigits: 2,
  }).format(value);
  return `৳${number}`;
}

export function formatDate(value: Date | string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    dateStyle: "medium",
  }).format(new Date(value));
}
