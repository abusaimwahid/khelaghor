"use client";

import { useState } from "react";
import { Check, Circle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { changePasswordAction } from "@/app/actions/auth";
import { evaluatePassword } from "@/server/password-policy";
import type { PasswordChangeErrorCode } from "@/server/password-change";

const errorMessages: Record<
  PasswordChangeErrorCode,
  { title: string; description: string; field?: string }
> = {
  CURRENT_PASSWORD_INCORRECT: {
    title: "Current password is incorrect",
    description: "Enter the temporary or current password used to sign in.",
    field: "current-password",
  },
  PASSWORD_TOO_SHORT: {
    title: "New password is too short",
    description: "Use at least 12 characters.",
    field: "new-password",
  },
  PASSWORD_COMPLEXITY_FAILED: {
    title: "New password needs more variety",
    description: "Include uppercase, lowercase, number, and symbol characters.",
    field: "new-password",
  },
  PASSWORD_CONFIRMATION_MISMATCH: {
    title: "Passwords do not match",
    description: "Re-enter the same new password in both fields.",
    field: "confirm-password",
  },
  PASSWORD_REUSE_NOT_ALLOWED: {
    title: "Choose a different password",
    description:
      "Your new password cannot be the same as your current password.",
    field: "new-password",
  },
  SESSION_INVALID: {
    title: "Your session has expired",
    description: "Sign in again before changing your password.",
  },
  ACCOUNT_INACTIVE: {
    title: "Account unavailable",
    description: "Contact an administrator to restore access to this account.",
  },
};

function PasswordInput({
  id,
  name,
  label,
  describedBy,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  describedBy?: string;
  onChange?: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-extrabold text-navy">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={name === "currentPassword" ? undefined : 12}
          autoComplete={
            name === "currentPassword" ? "current-password" : "new-password"
          }
          aria-describedby={describedBy}
          onChange={(event) => onChange?.(event.target.value)}
          className="kg-input min-h-12 pr-12"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="focus-ring absolute inset-y-1 right-1 grid w-10 place-items-center rounded-[10px] text-slate-500 transition hover:bg-slate-100 hover:text-navy"
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Eye aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}

export function PasswordChangeForm({ errorCode }: { errorCode?: string }) {
  const [newPassword, setNewPassword] = useState("");
  const error =
    errorCode && errorCode in errorMessages
      ? errorMessages[errorCode as PasswordChangeErrorCode]
      : undefined;
  const requirements = evaluatePassword(newPassword);

  return (
    <form action={changePasswordAction} className="mt-7 space-y-5">
      {error ? (
        <div
          role="alert"
          className="rounded-[16px] border border-red-200 bg-red-50/80 p-4 text-red-900"
        >
          <p className="font-extrabold">{error.title}</p>
          <p className="mt-1 text-sm leading-6 text-red-700">
            {error.description}
          </p>
        </div>
      ) : null}
      <PasswordInput
        id="current-password"
        name="currentPassword"
        label="Current password"
      />
      <div>
        <PasswordInput
          id="new-password"
          name="newPassword"
          label="New password"
          describedBy="password-requirements"
          onChange={setNewPassword}
        />
        <div
          id="password-requirements"
          className="mt-3 rounded-[14px] bg-slate-50 p-4"
        >
          <p className="flex items-center gap-2 text-sm font-extrabold text-navy">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-teal" />{" "}
            Password requirements
          </p>
          <ul className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            {requirements.map((requirement) => (
              <li key={requirement.key} className="flex items-center gap-2">
                {requirement.met ? (
                  <Check
                    aria-hidden="true"
                    className="h-4 w-4 text-emerald-600"
                  />
                ) : (
                  <Circle
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-slate-300"
                  />
                )}
                <span
                  className={
                    requirement.met ? "font-bold text-emerald-700" : undefined
                  }
                >
                  {requirement.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <PasswordInput
        id="confirm-password"
        name="confirmPassword"
        label="Confirm new password"
      />
      <button className="kg-button kg-button-primary min-h-12 w-full">
        Update password
      </button>
    </form>
  );
}
