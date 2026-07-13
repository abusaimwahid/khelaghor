import { changePasswordAction } from "@/app/actions/auth";
import { ErrorState } from "@/components/states";
import { requireUser } from "@/server/security";

export const dynamic = "force-dynamic";

export default async function AccountSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; required?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  return (
    <div className="container py-10">
      <section className="kg-card mx-auto max-w-xl p-6">
        <p className="text-sm font-black uppercase text-teal">
          Account security
        </p>
        <h1 className="mt-1 text-3xl font-black text-navy">Change password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {user.forcePasswordChange || params.required
            ? "This account was created through a secure bootstrap flow. Set a new private password before continuing."
            : "Keep your KhelaGhor account protected with a strong password."}
        </p>
        {params.error ? (
          <div className="mt-5">
            <ErrorState
              title="Password change failed"
              description={params.error}
            />
          </div>
        ) : null}
        <form action={changePasswordAction} className="mt-6 space-y-4">
          <label className="block font-bold text-navy">
            Current password
            <input
              name="currentPassword"
              type="password"
              required
              className="kg-input mt-2"
            />
          </label>
          <label className="block font-bold text-navy">
            New password
            <input
              name="newPassword"
              type="password"
              required
              minLength={12}
              className="kg-input mt-2"
            />
          </label>
          <label className="block font-bold text-navy">
            Confirm new password
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={12}
              className="kg-input mt-2"
            />
          </label>
          <button className="kg-button kg-button-primary w-full">
            Update password
          </button>
        </form>
      </section>
    </div>
  );
}
