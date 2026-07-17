import crypto from "node:crypto";
import path from "node:path";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { getEnv } from "./env";

export type UploadPurpose =
  | "product"
  | "product-variant"
  | "brand"
  | "category"
  | "homepage"
  | "blog"
  | "review"
  | "return-evidence"
  | "support-attachment"
  | "site-logo"
  | "favicon";

export type StoredFile = {
  url: string;
  key: string;
  provider: string;
  bytes: number;
  mimeType: string;
};

export type StorageProvider = {
  upload(file: File, purpose: UploadPurpose): Promise<StoredFile>;
  delete(key: string): Promise<void>;
};

export class StorageUnavailableError extends Error {
  constructor() {
    super("Uploads are unavailable in this staging environment.");
    this.name = "StorageUnavailableError";
  }
}

const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/x-icon", ".ico"],
  ["image/vnd.microsoft.icon", ".ico"],
  ["application/pdf", ".pdf"],
]);

export function detectFileType(bytes: Uint8Array) {
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.slice(start, start + length));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes
      .slice(0, 8)
      .every(
        (value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index],
      )
  )
    return "image/png";
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "image/webp";
  if (ascii(0, 5) === "%PDF-") return "application/pdf";
  if (bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0)
    return "image/x-icon";
  return null;
}

export function readImageDimensions(
  bytes: Uint8Array,
  mime: string,
): { width: number; height: number } | null {
  if (mime === "image/png" && bytes.length >= 24)
    return {
      width: new DataView(bytes.buffer, bytes.byteOffset).getUint32(16),
      height: new DataView(bytes.buffer, bytes.byteOffset).getUint32(20),
    };
  if (mime === "image/gif" && bytes.length >= 10)
    return {
      width: bytes[6] | (bytes[7] << 8),
      height: bytes[8] | (bytes[9] << 8),
    };
  if (
    mime === "image/webp" &&
    bytes.length >= 30 &&
    String.fromCharCode(...bytes.slice(12, 16)) === "VP8X"
  )
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    };
  if (mime === "image/jpeg") {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker)
      )
        return {
          height: (bytes[offset + 5] << 8) + bytes[offset + 6],
          width: (bytes[offset + 7] << 8) + bytes[offset + 8],
        };
      if (length < 2) break;
      offset += length + 2;
    }
  }
  return null;
}

export function validateFileSignature(bytes: Uint8Array, claimedType: string) {
  if (bytes.length === 0) throw new Error("Empty files are not allowed.");
  const detected = detectFileType(bytes);
  if (!detected)
    throw new Error("File content is not a supported image or PDF.");
  const normalizedMime =
    detected === "image/x-icon" ? "image/x-icon" : detected;
  const claimedMime =
    claimedType === "image/vnd.microsoft.icon" ? "image/x-icon" : claimedType;
  if (claimedMime !== normalizedMime)
    throw new Error("File content does not match its declared type.");
  return normalizedMime;
}

async function assertValidFile(file: File, purpose: UploadPurpose) {
  if (file.size === 0) throw new Error("Empty files are not allowed.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const normalizedMime = validateFileSignature(bytes, file.type);
  const env = getEnv();
  const extension = allowedMimeTypes.get(normalizedMime);
  if (
    !extension ||
    (file.type === "application/pdf" &&
      !["return-evidence", "support-attachment"].includes(purpose))
  )
    throw new Error(
      "Only supported image files are allowed; PDF is accepted for returns and support.",
    );
  if (file.size > env.STORAGE_MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(
      `File size must be ${env.STORAGE_MAX_FILE_SIZE_MB}MB or less.`,
    );
  }
  const dimensions = readImageDimensions(bytes, normalizedMime);
  if (dimensions) {
    const min = Math.max(
      1,
      Number(process.env.STORAGE_IMAGE_MIN_DIMENSION ?? 32),
    );
    const max = Math.max(
      min,
      Number(process.env.STORAGE_IMAGE_MAX_DIMENSION ?? 8000),
    );
    const maxPixels = Math.max(
      1_000_000,
      Number(process.env.STORAGE_IMAGE_MAX_PIXELS ?? 40_000_000),
    );
    if (dimensions.width < min || dimensions.height < min)
      throw new Error(
        `Image dimensions must be at least ${min}×${min} pixels.`,
      );
    if (
      dimensions.width > max ||
      dimensions.height > max ||
      dimensions.width * dimensions.height > maxPixels
    )
      throw new Error("Image dimensions are too large.");
  }
  return { extension, bytes };
}

function uniqueName(extension: string, purpose: UploadPurpose) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${purpose}/${stamp}/${crypto.randomBytes(16).toString("hex")}${extension}`;
}

function localUploadPath(key: string) {
  const normalised = path.posix.normalize(key).replace(/^\/+/, "");
  if (
    normalised.startsWith("../") ||
    normalised.includes("/../") ||
    path.isAbsolute(key) ||
    !/^[a-z0-9/_-]+\.(jpg|jpeg|png|webp|gif|ico|pdf)$/i.test(normalised)
  ) {
    throw new Error("Invalid upload key.");
  }
  return path.join(process.cwd(), "public", "uploads", normalised);
}

class LocalStorageProvider implements StorageProvider {
  async upload(file: File, purpose: UploadPurpose): Promise<StoredFile> {
    if (process.env.NODE_ENV === "production")
      throw new Error("Local file storage is disabled in production.");
    const { extension, bytes } = await assertValidFile(file, purpose);
    const key = uniqueName(extension, purpose);
    const dir = path.join(
      process.cwd(),
      "public",
      "uploads",
      path.dirname(key),
    );
    await mkdir(dir, { recursive: true });
    await writeFile(localUploadPath(key), bytes);
    return {
      url: `/uploads/${key}`,
      key,
      provider: "local",
      bytes: file.size,
      mimeType: file.type,
    };
  }

  async delete(key: string) {
    if (process.env.NODE_ENV === "production")
      throw new Error("Local file storage is disabled in production.");
    await unlink(localUploadPath(key)).catch(() => undefined);
  }
}

class CloudinaryStorageProvider implements StorageProvider {
  async upload(file: File, purpose: UploadPurpose): Promise<StoredFile> {
    const env = getEnv();
    const { extension } = await assertValidFile(file, purpose);
    if (
      !env.CLOUDINARY_CLOUD_NAME ||
      !env.CLOUDINARY_API_KEY ||
      !env.CLOUDINARY_API_SECRET
    ) {
      throw new Error(
        "Cloudinary credentials are required for production uploads.",
      );
    }
    const publicId = uniqueName(extension, purpose).replace(
      /\.[a-z0-9]+$/i,
      "",
    );
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "khelaghor";
    const signaturePayload = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
    const signature = crypto
      .createHash("sha1")
      .update(signaturePayload)
      .digest("hex");
    const form = new FormData();
    form.set("file", file);
    form.set("api_key", env.CLOUDINARY_API_KEY);
    form.set("timestamp", String(timestamp));
    form.set("folder", folder);
    form.set("public_id", publicId);
    form.set("signature", signature);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${file.type === "application/pdf" ? "raw" : "image"}/upload`,
      {
        method: "POST",
        body: form,
      },
    );
    if (!response.ok) throw new Error("Cloudinary upload failed.");
    const body = (await response.json()) as {
      secure_url: string;
      public_id: string;
      bytes?: number;
      format?: string;
    };
    return {
      url: body.secure_url,
      key: body.public_id,
      provider: "cloudinary",
      bytes: body.bytes ?? file.size,
      mimeType: file.type,
    };
  }

  async delete(key: string) {
    const env = getEnv();
    if (
      !env.CLOUDINARY_CLOUD_NAME ||
      !env.CLOUDINARY_API_KEY ||
      !env.CLOUDINARY_API_SECRET
    ) {
      throw new Error(
        "Cloudinary credentials are required for production deletes.",
      );
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const signaturePayload = `public_id=${key}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
    const signature = crypto
      .createHash("sha1")
      .update(signaturePayload)
      .digest("hex");
    const form = new FormData();
    form.set("api_key", env.CLOUDINARY_API_KEY);
    form.set("timestamp", String(timestamp));
    form.set("public_id", key);
    form.set("signature", signature);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: "POST",
        body: form,
      },
    );
    if (!response.ok) throw new Error("Cloudinary delete failed.");
  }
}

class UnconfiguredStorageProvider implements StorageProvider {
  constructor(private readonly name: string) {}
  async upload(): Promise<StoredFile> {
    throw new Error(`${this.name} storage credentials are not configured.`);
  }
  async delete() {
    throw new Error(`${this.name} storage credentials are not configured.`);
  }
}

class DisabledStorageProvider implements StorageProvider {
  async upload(): Promise<StoredFile> {
    throw new StorageUnavailableError();
  }
  async delete() {
    throw new StorageUnavailableError();
  }
}

export function getStorageProvider(): StorageProvider {
  const driver = getEnv().STORAGE_DRIVER;
  if (driver === "disabled") return new DisabledStorageProvider();
  if (driver === "cloudinary") return new CloudinaryStorageProvider();
  if (driver === "s3") return new UnconfiguredStorageProvider("S3");
  if (driver === "r2") return new UnconfiguredStorageProvider("Cloudflare R2");
  return new LocalStorageProvider();
}

export async function saveUpload(
  file: File,
  purpose: UploadPurpose = "product",
) {
  return getStorageProvider().upload(file, purpose);
}

export async function deleteUpload(key: string) {
  return getStorageProvider().delete(key);
}

function protectedUploadPath(key: string) {
  const normalised = path.posix.normalize(key).replace(/^\/+/, "");
  if (
    normalised.startsWith("../") ||
    normalised.includes("/../") ||
    path.isAbsolute(key) ||
    !/^[a-z0-9/_-]+\.(jpg|jpeg|png|webp|gif|pdf)$/i.test(normalised)
  )
    throw new Error("Invalid protected file key.");
  return path.join(process.cwd(), ".protected-uploads", normalised);
}

export async function saveProtectedUpload(file: File, purpose: UploadPurpose) {
  const { extension, bytes } = await assertValidFile(file, purpose);
  const key = uniqueName(extension, purpose);
  if (getEnv().STORAGE_DRIVER === "local") {
    const target = protectedUploadPath(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
    return { key, provider: "local", publicUrl: null as string | null };
  }
  const stored = await getStorageProvider().upload(file, purpose);
  return { key: stored.key, provider: stored.provider, publicUrl: stored.url };
}

export async function readProtectedUpload(input: {
  provider: string;
  key: string;
  publicUrl?: string | null;
}) {
  if (input.provider === "local")
    return readFile(protectedUploadPath(input.key));
  if (!input.publicUrl) throw new Error("Protected file is unavailable.");
  const response = await fetch(input.publicUrl);
  if (!response.ok) throw new Error("Protected file is unavailable.");
  return Buffer.from(await response.arrayBuffer());
}
