import { saveLegalReviewAction } from "@/app/actions/legal-review";
import { AdminHero, AdminShell } from "@/components/admin-shell";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/security";
const policies = [
  "Privacy Policy",
  "Terms and Conditions",
  "Shipping Policy",
  "Return and Refund Policy",
  "Payment Policy",
  "Cancellation Policy",
  "Cookie Policy",
];
export default async function LegalReviewPage() {
  await requirePermission("settings.update");
  const rows = await prisma.legalPolicyReview.findMany();
  return (
    <AdminShell>
      <AdminHero
        title="Legal Review Workflow"
        description="Records review metadata only. REVIEWED means a named reviewer and date were recorded; it is not an automated legal approval."
      />
      <p className="rounded-xl border border-orange/30 bg-orange/10 p-4 font-black text-orange">
        Requires qualified legal review before launch.
      </p>
      <div className="grid gap-4">
        {policies.map((policy) => {
          const row = rows.find((item) => item.policy === policy);
          return (
            <form
              key={policy}
              action={saveLegalReviewAction}
              className="kg-card grid gap-3 p-5 md:grid-cols-3"
            >
              <input type="hidden" name="policy" value={policy} />
              <h2 className="text-lg font-black text-navy md:col-span-3">
                {policy}
              </h2>
              <label>
                Version
                <input
                  name="version"
                  defaultValue={row?.version ?? ""}
                  className="kg-input mt-1"
                />
              </label>
              <label>
                Effective date
                <input
                  name="effectiveDate"
                  type="date"
                  defaultValue={
                    row?.effectiveDate?.toISOString().slice(0, 10) ?? ""
                  }
                  className="kg-input mt-1"
                />
              </label>
              <label>
                Status
                <select
                  name="status"
                  defaultValue={row?.status ?? "REQUIRES_REVIEW"}
                  className="kg-input mt-1"
                >
                  <option>REQUIRES_REVIEW</option>
                  <option>IN_REVIEW</option>
                  <option>REVIEWED</option>
                </select>
              </label>
              <label>
                Reviewed by
                <input
                  name="reviewedBy"
                  defaultValue={row?.reviewedBy ?? ""}
                  className="kg-input mt-1"
                />
              </label>
              <label>
                Review date
                <input
                  name="reviewDate"
                  type="date"
                  defaultValue={
                    row?.reviewDate?.toISOString().slice(0, 10) ?? ""
                  }
                  className="kg-input mt-1"
                />
              </label>
              <label>
                Notes
                <textarea
                  name="notes"
                  defaultValue={row?.notes ?? ""}
                  className="kg-input mt-1"
                />
              </label>
              <div className="md:col-span-3">
                <button className="admin-button admin-button-primary">
                  Save review metadata
                </button>
              </div>
            </form>
          );
        })}
      </div>
    </AdminShell>
  );
}
