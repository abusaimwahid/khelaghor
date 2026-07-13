import { loginAction, registerAction } from "@/app/actions/auth";

export function SimplePage({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <section className="container py-14">
      <div className="rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-black text-navy">{title}</h1>
        <div className="mt-5 max-w-3xl space-y-4 leading-8 text-slate-600">
          {children ?? (
            <>
              <p>KhelaGhor keeps this page editable through the content management model, with SEO fields, revision-friendly copy and future Bangla translation support.</p>
              <p>For production, update the admin content entry with final legal, courier, payment and service details.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" | "forgot" | "reset" }) {
  const title = { login: "Login", register: "Create Account", forgot: "Forgot Password", reset: "Reset Password" }[mode];
  const action = mode === "login" ? loginAction : mode === "register" ? registerAction : undefined;
  return (
    <section className="container grid min-h-[620px] place-items-center py-12">
      <form action={action} className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-navy">{title}</h1>
        <p className="mt-2 text-slate-600">Secure email/password authentication with OTP, Google and Facebook-ready architecture.</p>
        {mode === "register" ? <label className="mt-6 block font-bold text-navy">Full name<input name="name" className="mt-2 w-full rounded-md border border-[var(--border)] p-3" /></label> : null}
        {mode !== "reset" ? <label className="mt-4 block font-bold text-navy">Email<input name="email" type="email" className="mt-2 w-full rounded-md border border-[var(--border)] p-3" /></label> : null}
        {mode === "register" ? <label className="mt-4 block font-bold text-navy">Phone<input name="phone" className="mt-2 w-full rounded-md border border-[var(--border)] p-3" /></label> : null}
        {mode !== "forgot" ? <label className="mt-4 block font-bold text-navy">Password<input name="password" type="password" className="mt-2 w-full rounded-md border border-[var(--border)] p-3" /></label> : null}
        {mode === "reset" ? <label className="mt-4 block font-bold text-navy">Confirm password<input type="password" className="mt-2 w-full rounded-md border border-[var(--border)] p-3" /></label> : null}
        <button className="mt-6 w-full rounded-md bg-coral px-5 py-3 font-black text-white">{title}</button>
      </form>
    </section>
  );
}
