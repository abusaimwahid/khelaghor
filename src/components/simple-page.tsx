import Link from "next/link";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";
import { loginAction, registerAction } from "@/app/actions/auth";
import { AuthPasswordField } from "@/components/forms/auth-password-field";

export function SimplePage({
  title,
  children,
  legalReview = false,
}: {
  title: string;
  children?: React.ReactNode;
  legalReview?: boolean;
}) {
  return (
    <section className="container storefront-page">
      <div className="storefront-surface overflow-hidden">
        <div className="border-b border-[var(--border)] bg-gradient-to-br from-[#fff4f6] via-white to-[#eaf9f6] p-7 md:p-12">
          <p className="storefront-eyebrow">KhelaGhor information</p>
          <h1 className="storefront-title mt-3">{title}</h1>
        </div>
        <div className="prose-policy max-w-4xl space-y-5 p-7 leading-8 text-slate-600 md:p-12">
          {legalReview ? (
            <p className="rounded-xl border border-orange/30 bg-orange/10 p-4 font-black text-orange">
              Requires qualified legal review before launch.
            </p>
          ) : null}
          {children ?? (
            <>
              <p>
                KhelaGhor keeps this page editable through the content
                management model, with SEO fields, revision-friendly copy and
                future Bangla translation support.
              </p>
              <p>
                For production, update the admin content entry with final legal,
                courier, payment and service details.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function AuthForm({
  mode,
}: {
  mode: "login" | "register" | "forgot" | "reset";
}) {
  const title = {
    login: "Login",
    register: "Create Account",
    forgot: "Forgot Password",
    reset: "Reset Password",
  }[mode];
  const action =
    mode === "login"
      ? loginAction
      : mode === "register"
        ? registerAction
        : undefined;
  return (
    <section className="container grid min-h-[620px] items-center gap-8 py-8 lg:grid-cols-[1fr_480px] lg:py-12">
      <div className="hidden min-h-[500px] overflow-hidden rounded-[var(--radius-hero)] border border-white/10 bg-gradient-to-br from-navy via-[#153963] to-teal p-10 text-white shadow-[var(--shadow-md)] lg:flex lg:flex-col lg:justify-between">
        <Sparkles className="h-12 w-12 text-sun" />
        <div>
          <p className="text-sm font-black uppercase tracking-[.2em] text-sun">
            Play. Learn. Grow.
          </p>
          <h2 className="mt-4 max-w-xl text-5xl font-black leading-tight">
            A happier shopping experience for every family.
          </h2>
          <div className="mt-8 flex gap-6 text-sm font-bold text-white/80">
            <span className="flex gap-2">
              <ShieldCheck className="h-5 w-5" /> Secure
            </span>
            <span className="flex gap-2">
              <Heart className="h-5 w-5" /> Parent trusted
            </span>
          </div>
        </div>
      </div>
      <form
        action={action}
        className="storefront-surface w-full rounded-[var(--radius-hero)] p-6 md:p-9"
      >
        <p className="storefront-eyebrow">Welcome to KhelaGhor</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-navy md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Securely continue to your orders, wishlist and family-friendly picks.
        </p>
        {mode === "register" ? (
          <label className="mt-7 block font-bold text-navy">
            Full name
            <input name="name" className="kg-input mt-2" required />
          </label>
        ) : null}
        {mode !== "reset" ? (
          <label className="mt-5 block font-bold text-navy">
            Email
            <input
              name="email"
              type="email"
              className="kg-input mt-2"
              required
            />
          </label>
        ) : null}
        {mode === "register" ? (
          <label className="mt-5 block font-bold text-navy">
            Phone
            <input name="phone" className="kg-input mt-2" />
          </label>
        ) : null}
        {mode !== "forgot" ? (
          <AuthPasswordField
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            minLength={mode === "login" ? undefined : 12}
          />
        ) : null}
        {mode === "reset" ? (
          <AuthPasswordField
            label="Confirm password"
            name="confirmPassword"
            autoComplete="new-password"
            minLength={12}
          />
        ) : null}
        <button className="kg-button kg-button-primary mt-6 min-h-12 w-full">
          {title}
        </button>
        {mode === "login" ? (
          <Link href="/forgot-password" className="mt-4 block text-center text-sm font-black text-teal hover:text-coral">
            Forgot your password?
          </Link>
        ) : null}
        <p className="mt-6 text-center text-sm font-bold text-slate-500">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link href="/register" className="text-coral">
                Create an account
              </Link>
            </>
          ) : mode === "register" ? (
            <>
              Already registered?{" "}
              <Link href="/login" className="text-coral">
                Sign in
              </Link>
            </>
          ) : (
            <Link href="/login" className="text-coral">
              Back to sign in
            </Link>
          )}
        </p>
      </form>
    </section>
  );
}
