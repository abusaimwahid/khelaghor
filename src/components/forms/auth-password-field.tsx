"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function AuthPasswordField({
  label = "Password",
  name = "password",
  autoComplete,
  minLength,
}: {
  label?: string;
  name?: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  const id = `auth-${name}`;
  return (
    <div className="mt-5">
      <label htmlFor={id} className="block font-bold text-navy">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          className="kg-input pr-12"
          required
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          className="focus-ring absolute inset-y-1 right-1 grid w-10 place-items-center rounded-[10px] text-slate-500 transition hover:bg-slate-100 hover:text-navy"
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Eye aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      </div>
      {autoComplete === "new-password" ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Use 12+ characters with uppercase, lowercase, number, and symbol.
        </p>
      ) : null}
    </div>
  );
}
