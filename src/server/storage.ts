import crypto from "node:crypto";
import path from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { getEnv } from "./env";

export type UploadPurpose =
  "product" | "brand" | "category" | "blog" | "review" | "return-evidence";

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

const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

function assertValidImage(file: File) {
  const env = getEnv();
  const extension = allowedMimeTypes.get(file.type);
  if (!extension)
    throw new Error("Only JPG, PNG, GIF and WebP image files are allowed.");
  if (file.size > env.STORAGE_MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(
      `File size must be ${env.STORAGE_MAX_FILE_SIZE_MB}MB or less.`,
    );
  }
  return extension;
}

function uniqueName(extension: string, purpose: UploadPurpose) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${purpose}/${stamp}/${crypto.randomBytes(16).toString("hex")}${extension}`;
}

class LocalStorageProvider implements StorageProvider {
  async upload(file: File, purpose: UploadPurpose): Promise<StoredFile> {
    if (process.env.NODE_ENV === "production")
      throw new Error("Local file storage is disabled in production.");
    const extension = assertValidImage(file);
    const key = uniqueName(extension, purpose);
    const bytes = Buffer.from(await file.arrayBuffer());
    const dir = path.join(
      process.cwd(),
      "public",
      "uploads",
      path.dirname(key),
    );
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(process.cwd(), "public", "uploads", key), bytes);
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
    await unlink(path.join(process.cwd(), "public", "uploads", key)).catch(
      () => undefined,
    );
  }
}

class CloudinaryStorageProvider implements StorageProvider {
  async upload(file: File, purpose: UploadPurpose): Promise<StoredFile> {
    const env = getEnv();
    const extension = assertValidImage(file);
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
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
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

export function getStorageProvider(): StorageProvider {
  const driver = getEnv().STORAGE_DRIVER;
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
