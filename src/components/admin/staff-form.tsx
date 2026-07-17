import { createStaffAction, updateStaffAction } from "@/app/actions/staff";

type StaffFormProps = {
  roles: { id: string; name: string }[];
  permissions: { id: string; key: string }[];
  staff?: {
    id: string;
    name: string | null;
    email: string;
    status: string;
    forcePasswordChange: boolean;
    staffNote: string | null;
    roles: { roleId: string }[];
    permissionOverrides: { permissionId: string; effect: string }[];
  };
};

export function StaffForm({ roles, permissions, staff }: StaffFormProps) {
  const action = staff ? updateStaffAction : createStaffAction;
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="staffId" value={staff?.id ?? ""} />
      <section className="kg-card grid gap-4 p-6 md:grid-cols-2">
        <label className="font-bold text-navy">
          Full name
          <input
            name="name"
            required
            minLength={2}
            defaultValue={staff?.name ?? ""}
            className="kg-input mt-2"
          />
        </label>
        <label className="font-bold text-navy">
          Email
          <input
            name="email"
            type="email"
            required
            disabled={Boolean(staff)}
            defaultValue={staff?.email ?? ""}
            className="kg-input mt-2"
          />
        </label>
        <label className="font-bold text-navy">
          Role
          <select
            name="roleId"
            required
            defaultValue={staff?.roles[0]?.roleId ?? ""}
            className="kg-input mt-2"
          >
            <option value="" disabled>
              Select role
            </option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
        {!staff ? (
          <label className="font-bold text-navy">
            Temporary password
            <input
              name="temporaryPassword"
              type="password"
              required
              minLength={12}
              className="kg-input mt-2"
            />
            <span className="mt-1 block text-xs text-slate-500">
              12+ characters with upper, lower, number and symbol. Never logged.
            </span>
          </label>
        ) : null}
        <label className="flex items-center gap-2 font-bold text-navy">
          <input
            name="active"
            type="checkbox"
            defaultChecked={!staff || staff.status === "ACTIVE"}
          />{" "}
          Active account
        </label>
        <label className="flex items-center gap-2 font-bold text-navy">
          <input
            name="forcePasswordChange"
            type="checkbox"
            defaultChecked={staff?.forcePasswordChange ?? true}
          />{" "}
          Force password change
        </label>
        <label className="font-bold text-navy md:col-span-2">
          Internal staff note
          <textarea
            name="note"
            defaultValue={staff?.staffNote ?? ""}
            className="kg-input mt-2 min-h-24"
          />
        </label>
      </section>
      <section className="kg-card p-6">
        <h2 className="text-xl font-black text-navy">Permission overrides</h2>
        <p className="mt-1 text-sm text-slate-500">
          Role permissions are inherited. Overrides are explicit and audited;
          use sparingly.
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {permissions
            .filter((item) => item.key !== "*")
            .map((permission) => {
              const current = staff?.permissionOverrides.find(
                (item) => item.permissionId === permission.id,
              );
              return (
                <div
                  key={permission.id}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border p-3 text-xs"
                >
                  <code className="truncate">{permission.key}</code>
                  <label>
                    <input
                      type="checkbox"
                      name="allowPermissionIds"
                      value={permission.id}
                      defaultChecked={current?.effect === "ALLOW"}
                    />{" "}
                    Add
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="denyPermissionIds"
                      value={permission.id}
                      defaultChecked={current?.effect === "DENY"}
                    />{" "}
                    Deny
                  </label>
                </div>
              );
            })}
        </div>
      </section>
      <div className="sticky bottom-4 flex justify-end rounded-xl border bg-white/95 p-3 shadow-lg backdrop-blur">
        <button className="admin-button admin-button-primary">
          {staff ? "Save and revoke sessions" : "Create staff"}
        </button>
      </div>
    </form>
  );
}
