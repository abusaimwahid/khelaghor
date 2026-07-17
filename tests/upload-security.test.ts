import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  detectFileType,
  readImageDimensions,
  validateFileSignature,
} from "@/server/storage";

describe("upload hardening", () => {
  it("detects byte signatures and rejects disguised executable content", async () => {
    const png = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 64,
      0, 0, 0, 64,
    ]);
    expect(detectFileType(png)).toBe("image/png");
    expect(readImageDimensions(png, "image/png")).toEqual({
      width: 64,
      height: 64,
    });
    expect(() =>
      validateFileSignature(
        new TextEncoder().encode("#!/bin/sh\necho unsafe"),
        "image/jpeg",
      ),
    ).toThrow(/not a supported/i);
  });

  it("rejects MIME mismatch, empty files and SVG", async () => {
    expect(() =>
      validateFileSignature(
        new TextEncoder().encode("%PDF-1.7\n"),
        "image/jpeg",
      ),
    ).toThrow(/does not match/i);
    expect(() => validateFileSignature(new Uint8Array(), "image/png")).toThrow(
      /empty/i,
    );
    expect(() =>
      validateFileSignature(
        new TextEncoder().encode("<svg><script>alert(1)</script></svg>"),
        "image/svg+xml",
      ),
    ).toThrow(/not a supported/i);
  });

  it("keeps orphan cleanup non-destructive by default", () => {
    const cleanup = readFileSync("scripts/cleanup-files.ts", "utf8");
    expect(cleanup).toContain('process.argv.includes("--execute")');
    expect(cleanup).toContain("No files deleted");
    expect(cleanup).toContain("retentionHours");
  });
});
