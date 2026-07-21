import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const failures = [];
const notes = [];
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const sensitiveName = /(SECRET|PASSWORD|TOKEN|API_KEY|DATABASE_URL|DIRECT_URL|DSN)$/i;
const realEnvPattern = /^\.env(?:$|\.)/;
const forbiddenRuntimeFiles = [
  ".env",
  ".env.local",
  ".env.staging",
  ".env.staging.local",
  ".env.staging.runtime",
  ".env.remote.backup",
  ".env.local.remote.backup",
];

function parseEnv(file) {
  if (!existsSync(file)) return {};
  const parsed = {};
  for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    )
      value = value.slice(1, -1);
    parsed[match[1]] = value;
  }
  return parsed;
}

function databaseKind(value) {
  if (!value) return "missing";
  try {
    return localHosts.has(new URL(value).hostname) ? "local" : "remote";
  } catch {
    return "invalid";
  }
}

function auditContext(label, env, expectedDatabase) {
  const kind = databaseKind(env.DATABASE_URL);
  if (kind !== expectedDatabase)
    failures.push(`${label} DATABASE_URL must be ${expectedDatabase} (found ${kind}).`);
  if (env.APP_ENV === "production") {
    if (["", "local", "disabled"].includes(env.STORAGE_DRIVER ?? ""))
      failures.push("Production requires a safe remote STORAGE_DRIVER.");
    if (["", "dev", "logger"].includes(env.EMAIL_PROVIDER ?? ""))
      failures.push("Production requires a non-logging email provider.");
  }
}

const local = {
  ...parseEnv(resolve(root, ".env")),
  ...parseEnv(resolve(root, ".env.local")),
};
auditContext("Local development", local, "local");

const stagingPath = resolve(root, ".env.staging.runtime");
if (existsSync(stagingPath)) {
  const staging = parseEnv(stagingPath);
  auditContext("Staging runtime", staging, "remote");
  if (staging.APP_ENV !== "staging")
    failures.push("Staging runtime must set APP_ENV=staging.");
} else notes.push("Staging runtime file is absent (allowed until an explicit staging command). ");

const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => realEnvPattern.test(basename(file)) && basename(file) !== ".env.example");
if (tracked.length)
  failures.push(`Tracked runtime env files detected: ${tracked.join(", ")}.`);

const example = parseEnv(resolve(root, ".env.example"));
for (const fileName of [
  ".env",
  ".env.local",
  ".env.staging.runtime",
  ".env.staging.local",
]) {
  const env = parseEnv(resolve(root, fileName));
  for (const [key, value] of Object.entries(env)) {
    if (!value || !sensitiveName.test(key)) continue;
    const exampleValue = example[key];
    if (exampleValue && value === exampleValue)
      failures.push(`${fileName} reuses the example value for ${key}.`);
  }
}

if (process.argv.includes("--deploy")) {
  const requiredIgnores = [
    ".env",
    ".env.local",
    ".env.*.local",
    ".env.staging",
    ".env.staging.local",
    ".env.staging.runtime",
    ".env.remote.backup",
    ".env.local.remote.backup",
    ".vercel",
    ".next",
    "node_modules",
    "test-results",
    "playwright-report",
    "coverage",
  ];
  const ignorePath = resolve(root, ".vercelignore");
  const ignores = existsSync(ignorePath)
    ? new Set(readFileSync(ignorePath, "utf8").split(/\r?\n/).map((line) => line.trim()))
    : new Set();
  for (const entry of requiredIgnores)
    if (!ignores.has(entry)) failures.push(`.vercelignore is missing ${entry}.`);

  // Vercel uploads the working tree, so fail closed if a runtime env file is
  // present and not ignored. .env.example is intentionally allowed.
  for (const fileName of forbiddenRuntimeFiles) {
    if (existsSync(resolve(root, fileName)) && !ignores.has(fileName))
      failures.push(`Deploy context contains unignored runtime env file: ${fileName}.`);
  }
  const exampleFiles = [".env.example"];
  for (const fileName of exampleFiles) {
    if (!existsSync(resolve(root, fileName)))
      failures.push(`Required placeholder file is missing: ${fileName}.`);
  }
}

if (failures.length) {
  console.error("Environment audit: FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Environment audit: PASS${process.argv.includes("--deploy") ? " (deploy-safe)" : ""}`);
for (const note of notes) console.log(`- ${note.trim()}`);
