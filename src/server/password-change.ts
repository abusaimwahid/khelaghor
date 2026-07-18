import { strongPasswordSchema } from "./password-policy";

export const passwordChangeErrorCodes = [
  "CURRENT_PASSWORD_INCORRECT",
  "PASSWORD_TOO_SHORT",
  "PASSWORD_COMPLEXITY_FAILED",
  "PASSWORD_CONFIRMATION_MISMATCH",
  "PASSWORD_REUSE_NOT_ALLOWED",
  "SESSION_INVALID",
  "ACCOUNT_INACTIVE",
] as const;

export type PasswordChangeErrorCode = (typeof passwordChangeErrorCodes)[number];

export class PasswordChangeError extends Error {
  constructor(public readonly code: PasswordChangeErrorCode) {
    super(code);
  }
}

export type PasswordChangeInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function parsePasswordChangeInput(
  values: Record<string, unknown>,
): PasswordChangeInput {
  const currentPassword =
    typeof values.currentPassword === "string" ? values.currentPassword : "";
  const newPassword =
    typeof values.newPassword === "string" ? values.newPassword : "";
  const confirmPassword =
    typeof values.confirmPassword === "string" ? values.confirmPassword : "";

  if (!currentPassword)
    throw new PasswordChangeError("CURRENT_PASSWORD_INCORRECT");
  const passwordResult = strongPasswordSchema.safeParse(newPassword);
  if (!passwordResult.success) {
    const code = passwordResult.error.issues.some(
      (issue) => issue.message === "PASSWORD_TOO_SHORT",
    )
      ? "PASSWORD_TOO_SHORT"
      : "PASSWORD_COMPLEXITY_FAILED";
    throw new PasswordChangeError(code);
  }
  if (newPassword !== confirmPassword)
    throw new PasswordChangeError("PASSWORD_CONFIRMATION_MISMATCH");
  return { currentPassword, newPassword, confirmPassword };
}

type PasswordChangeUser = {
  id: string;
  status: string;
  passwordHash: string | null;
};

type PasswordChangeDependencies = {
  verify: (password: string, hash: string) => Promise<boolean>;
  hash: (password: string) => Promise<string>;
  updatePassword: (userId: string, passwordHash: string) => Promise<void>;
  revokeSessions: (userId: string) => Promise<void>;
  createSession: (userId: string) => Promise<void>;
  recordAudit: (userId: string) => Promise<void>;
};

export async function changePasswordForUser(
  user: PasswordChangeUser | null,
  input: PasswordChangeInput,
  dependencies: PasswordChangeDependencies,
) {
  if (!user) throw new PasswordChangeError("SESSION_INVALID");
  if (user.status !== "ACTIVE")
    throw new PasswordChangeError("ACCOUNT_INACTIVE");
  if (
    !user.passwordHash ||
    !(await dependencies.verify(input.currentPassword, user.passwordHash))
  )
    throw new PasswordChangeError("CURRENT_PASSWORD_INCORRECT");
  if (await dependencies.verify(input.newPassword, user.passwordHash))
    throw new PasswordChangeError("PASSWORD_REUSE_NOT_ALLOWED");

  const passwordHash = await dependencies.hash(input.newPassword);
  await dependencies.updatePassword(user.id, passwordHash);
  await dependencies.revokeSessions(user.id);
  await dependencies.createSession(user.id);
  await dependencies.recordAudit(user.id);
}
