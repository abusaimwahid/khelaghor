import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("BDT", "৳");
}

export function dhakaDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeZone: "Asia/Dhaka",
  }).format(new Date(date));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
