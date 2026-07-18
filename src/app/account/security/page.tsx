import { PasswordChangeForm } from "@/components/forms/password-change-form";
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
    <div className="container grid min-h-[calc(100vh-12rem)] place-items-center py-10 sm:py-14">
      <section className="kg-card w-full max-w-xl rounded-[24px] p-6 sm:p-9">
        <p className="text-sm font-black uppercase text-teal">
          Account security
        </p>
        <h1 className="mt-1 text-3xl font-black text-navy">Change password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {user.forcePasswordChange || params.required
            ? "This account was created through a secure bootstrap flow. Set a new private password before continuing."
            : "Keep your KhelaGhor account protected with a strong password."}
        </p>
        <PasswordChangeForm errorCode={params.error} />
      </section>
    </div>
  );
}
