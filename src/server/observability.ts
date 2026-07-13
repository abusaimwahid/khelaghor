const sensitive =
  /password|secret|token|authorization|cookie|card|store_passwd|api_key/i;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        sensitive.test(key) ? "[redacted]" : redact(nested),
      ]),
    );
  }
  return value;
}

export function logServerEvent(
  level: "info" | "warn" | "error",
  message: string,
  metadata: Record<string, unknown> = {},
) {
  const redactedMetadata = redact(metadata) as Record<string, unknown>;
  const payload = {
    level,
    message,
    service: "khelaghor",
    timestamp: new Date().toISOString(),
    ...redactedMetadata,
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
