import { z } from "zod";

export const passwordRequirements = [
  {
    key: "length",
    label: "Minimum 12 characters",
    test: (value: string) => value.length >= 12,
  },
  {
    key: "uppercase",
    label: "Uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    key: "lowercase",
    label: "Lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    key: "number",
    label: "Number",
    test: (value: string) => /[0-9]/.test(value),
  },
  {
    key: "symbol",
    label: "Symbol",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
] as const;

export const strongPasswordSchema = z
  .string()
  .min(12, "PASSWORD_TOO_SHORT")
  .regex(/[A-Z]/, "PASSWORD_COMPLEXITY_FAILED")
  .regex(/[a-z]/, "PASSWORD_COMPLEXITY_FAILED")
  .regex(/[0-9]/, "PASSWORD_COMPLEXITY_FAILED")
  .regex(/[^A-Za-z0-9]/, "PASSWORD_COMPLEXITY_FAILED");

export function evaluatePassword(password: string) {
  return passwordRequirements.map((requirement) => ({
    key: requirement.key,
    label: requirement.label,
    met: requirement.test(password),
  }));
}
