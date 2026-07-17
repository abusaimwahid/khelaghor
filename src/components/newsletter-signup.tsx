"use client";

import { useState } from "react";

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className={
        compact
          ? "flex overflow-hidden rounded-xl bg-white"
          : "mx-auto mt-6 flex max-w-xl overflow-hidden rounded-xl border-2 border-white bg-white shadow-lg"
      }
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");
        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/newsletter", {
          method: "POST",
          body: form,
        });
        const body = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          message?: string;
        };
        setPending(false);
        setMessage(
          body.ok
            ? "You're subscribed."
            : body.message || "Subscription failed.",
        );
        if (body.ok) event.currentTarget.reset();
      }}
    >
      <div className="min-w-0 flex-1">
        <input
          name="email"
          type="email"
          required
          placeholder="Email address"
          aria-label="Newsletter signup"
          className="h-full min-h-12 w-full px-3 text-navy outline-none"
        />
        {message && !compact ? (
          <p className="px-3 pb-2 text-xs font-bold text-teal">{message}</p>
        ) : null}
      </div>
      <button
        disabled={pending}
        className="bg-coral px-6 font-black text-white transition hover:bg-[#f44765] disabled:bg-slate-300"
      >
        {pending ? "Joining" : "Join"}
      </button>
    </form>
  );
}
