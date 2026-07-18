import bcrypt from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import {
  changePasswordForUser,
  parsePasswordChangeInput,
  PasswordChangeError,
  type PasswordChangeErrorCode,
} from "@/server/password-change";

const validInput = {
  currentPassword: "Temporary123!",
  newPassword: "Private456@Home",
  confirmPassword: "Private456@Home",
};

function expectCode(run: () => unknown, code: PasswordChangeErrorCode) {
  try {
    run();
    throw new Error("Expected password validation to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(PasswordChangeError);
    expect((error as PasswordChangeError).code).toBe(code);
  }
}

describe("password change validation", () => {
  it.each([
    ["Short1!", "PASSWORD_TOO_SHORT"],
    ["lowercase123!", "PASSWORD_COMPLEXITY_FAILED"],
    ["UPPERCASE123!", "PASSWORD_COMPLEXITY_FAILED"],
    ["NoNumbersHere!", "PASSWORD_COMPLEXITY_FAILED"],
    ["NoSymbols1234", "PASSWORD_COMPLEXITY_FAILED"],
  ] as const)("rejects an invalid new password", (newPassword, code) => {
    expectCode(
      () =>
        parsePasswordChangeInput({
          ...validInput,
          newPassword,
          confirmPassword: newPassword,
        }),
      code,
    );
  });

  it("rejects a confirmation mismatch", () => {
    expectCode(
      () =>
        parsePasswordChangeInput({
          ...validInput,
          confirmPassword: "Different456@Home",
        }),
      "PASSWORD_CONFIRMATION_MISMATCH",
    );
  });
});

describe("password change workflow", () => {
  async function fixture(currentPassword = validInput.currentPassword) {
    const passwordHash = await bcrypt.hash(currentPassword, 4);
    const dependencies = {
      verify: bcrypt.compare,
      hash: (value: string) => bcrypt.hash(value, 4),
      updatePassword: vi
        .fn<(userId: string, passwordHash: string) => Promise<void>>()
        .mockResolvedValue(undefined),
      revokeSessions: vi
        .fn<(userId: string) => Promise<void>>()
        .mockResolvedValue(undefined),
      createSession: vi
        .fn<(userId: string) => Promise<void>>()
        .mockResolvedValue(undefined),
      recordAudit: vi
        .fn<(userId: string) => Promise<void>>()
        .mockResolvedValue(undefined),
    };
    return { passwordHash, dependencies };
  }

  it("changes a forced password, clears the flag through persistence, and rotates sessions", async () => {
    const { passwordHash, dependencies } = await fixture();
    await changePasswordForUser(
      { id: "admin-1", status: "ACTIVE", passwordHash },
      validInput,
      dependencies,
    );
    expect(dependencies.updatePassword).toHaveBeenCalledOnce();
    expect(dependencies.revokeSessions).toHaveBeenCalledWith("admin-1");
    expect(dependencies.createSession).toHaveBeenCalledWith("admin-1");
    expect(dependencies.recordAudit).toHaveBeenCalledWith("admin-1");
    const newHash = dependencies.updatePassword.mock.calls[0]?.[1];
    expect(await bcrypt.compare(validInput.newPassword, newHash!)).toBe(true);
    expect(await bcrypt.compare(validInput.currentPassword, newHash!)).toBe(
      false,
    );
  });

  it("rejects an incorrect current password", async () => {
    const { passwordHash, dependencies } = await fixture("OtherCurrent123!");
    await expect(
      changePasswordForUser(
        { id: "admin-1", status: "ACTIVE", passwordHash },
        validInput,
        dependencies,
      ),
    ).rejects.toMatchObject({ code: "CURRENT_PASSWORD_INCORRECT" });
  });

  it("rejects password reuse", async () => {
    const reused = { ...validInput, currentPassword: validInput.newPassword };
    const { passwordHash, dependencies } = await fixture(
      validInput.newPassword,
    );
    await expect(
      changePasswordForUser(
        { id: "admin-1", status: "ACTIVE", passwordHash },
        reused,
        dependencies,
      ),
    ).rejects.toMatchObject({ code: "PASSWORD_REUSE_NOT_ALLOWED" });
  });

  it("blocks inactive accounts", async () => {
    const { passwordHash, dependencies } = await fixture();
    await expect(
      changePasswordForUser(
        { id: "admin-1", status: "BLOCKED", passwordHash },
        validInput,
        dependencies,
      ),
    ).rejects.toMatchObject({ code: "ACCOUNT_INACTIVE" });
  });

  it("blocks an expired or missing session", async () => {
    const { dependencies } = await fixture();
    await expect(
      changePasswordForUser(null, validInput, dependencies),
    ).rejects.toMatchObject({
      code: "SESSION_INVALID",
    });
  });
});
