import path from "node:path";
import crypto from "node:crypto";
import { readdir, stat, unlink } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const execute = process.argv.includes("--execute");
const provider =
  process.argv
    .find((value) => value.startsWith("--provider="))
    ?.split("=")[1] ?? "local";
const batchSize = Math.min(
  100,
  Math.max(
    1,
    Number(
      process.argv
        .find((value) => value.startsWith("--batch-size="))
        ?.split("=")[1] ?? 50,
    ),
  ),
);
const hoursArg = process.argv.find((value) =>
  value.startsWith("--older-than-hours="),
);
const retentionHours = Math.max(24, Number(hoursArg?.split("=")[1] ?? 168));
const root = path.join(process.cwd(), ".protected-uploads");

async function files(dir: string): Promise<string[]> {
  try {
    return (
      await Promise.all(
        (await readdir(dir, { withFileTypes: true })).map(async (entry) =>
          entry.isDirectory()
            ? files(path.join(dir, entry.name))
            : [path.join(dir, entry.name)],
        ),
      )
    ).flat();
  } catch {
    return [];
  }
}

async function main() {
  const referenced = new Set(
    (
      await prisma.fileAsset.findMany({
        where: { deletedAt: null },
        select: { storageKey: true },
      })
    ).map((asset) => asset.storageKey),
  );
  const cutoff = Date.now() - retentionHours * 60 * 60 * 1000;
  if (provider === "cloudinary") {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    const key = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud || !key || !secret)
      throw new Error(
        "Cloudinary cleanup requires configured staging credentials.",
      );
    const prefix =
      process.env.CLOUDINARY_CLEANUP_PREFIX ?? "khelaghor/staging/";
    if (!prefix.startsWith("khelaghor/staging/"))
      throw new Error(
        "Cloudinary cleanup is restricted to the khelaghor/staging folder.",
      );
    const publicUrls = await Promise.all([
      prisma.productImage.findMany({ select: { url: true } }),
      prisma.category.findMany({ select: { image: true } }),
      prisma.brand.findMany({ select: { logo: true } }),
      prisma.banner.findMany({ select: { image: true } }),
    ]);
    const urlKeys = publicUrls
      .flat()
      .flatMap((row) =>
        Object.values(row).filter(
          (value): value is string => typeof value === "string",
        ),
      )
      .map((url) => url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i)?.[1])
      .filter((value): value is string => Boolean(value));
    for (const value of urlKeys) referenced.add(value);
    const auth = Buffer.from(`${key}:${secret}`).toString("base64");
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud}/resources/image/upload?prefix=${encodeURIComponent(prefix)}&max_results=${batchSize}`,
      { headers: { Authorization: `Basic ${auth}` } },
    );
    if (!response.ok)
      throw new Error("Cloudinary staging inventory request failed.");
    const resources = (await response.json()) as {
      resources?: { public_id: string; created_at: string }[];
    };
    const candidates = (resources.resources ?? []).filter(
      (asset) =>
        !referenced.has(asset.public_id) &&
        new Date(asset.created_at).getTime() < cutoff,
    );
    console.info(
      `[files:cleanup] provider=cloudinary mode=${execute ? "EXECUTE" : "DRY_RUN"} prefix=${prefix} candidates=${candidates.length}`,
    );
    for (const asset of candidates) {
      console.info(
        `[files:cleanup] ${execute ? "delete" : "would-delete"} ${asset.public_id}`,
      );
      if (execute) {
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = crypto
          .createHash("sha1")
          .update(
            `public_id=${asset.public_id}&timestamp=${timestamp}${secret}`,
          )
          .digest("hex");
        const form = new URLSearchParams({
          public_id: asset.public_id,
          timestamp: String(timestamp),
          api_key: key,
          signature,
        });
        const deletion = await fetch(
          `https://api.cloudinary.com/v1_1/${cloud}/image/destroy`,
          { method: "POST", body: form },
        );
        if (!deletion.ok)
          throw new Error(
            "Cloudinary staging deletion failed; stop and review the report.",
          );
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
    if (!execute) console.info("[files:cleanup] No Cloudinary assets deleted.");
    return;
  }
  if (provider !== "local") throw new Error("Unsupported cleanup provider.");
  const candidates: string[] = [];
  for (const absolute of await files(root)) {
    const key = path.relative(root, absolute).split(path.sep).join("/");
    if (!referenced.has(key) && (await stat(absolute)).mtimeMs < cutoff)
      candidates.push(absolute);
  }
  console.info(
    `[files:cleanup] mode=${execute ? "EXECUTE" : "DRY_RUN"} retentionHours=${retentionHours} candidates=${candidates.length}`,
  );
  for (const absolute of candidates) {
    console.info(
      `[files:cleanup] ${execute ? "delete" : "would-delete"} ${path.relative(root, absolute)}`,
    );
    if (execute) await unlink(absolute);
  }
  if (!execute)
    console.info(
      "[files:cleanup] No files deleted. Pass --execute after reviewing the dry run.",
    );
}
main().finally(() => prisma.$disconnect());
