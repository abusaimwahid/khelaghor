"use client";

import { useState } from "react";
import { UploadCloud, X } from "lucide-react";

export function CmsImageField({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: string;
}) {
  const [url, setUrl] = useState(value);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    setMessage("");
    const form = new FormData();
    form.set("file", file);
    form.set("purpose", "homepage");
    const response = await fetch("/api/upload", { method: "POST", body: form });
    const body = (await response.json()) as {
      ok: boolean;
      url?: string;
      bytes?: number;
      message?: string;
    };
    setUploading(false);
    if (!response.ok || !body.ok || !body.url) {
      setMessage(body.message || "Upload failed");
      return;
    }
    setUrl(body.url);
    setMessage(
      body.bytes ? `${Math.round(body.bytes / 1024)} KB uploaded` : "Uploaded",
    );
  }

  return (
    <label>
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <div className="mt-1 flex gap-2">
        <input
          name={name}
          type="text"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="/uploads/homepage/example.jpg"
          className="h-11 min-w-0 flex-1 rounded-md border border-[var(--border)] p-3"
        />
        <span className="relative inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md bg-navy px-3 text-sm font-black text-white">
          <UploadCloud className="h-4 w-4" />
          {uploading ? "Uploading" : "Upload"}
          <input
            type="file"
            accept="image/*,.ico"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.currentTarget.value = "";
            }}
          />
        </span>
        {url ? (
          <button
            type="button"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-[var(--border)] text-slate-500"
            aria-label={`Remove ${label}`}
            onClick={() => setUrl("")}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {url ? (
        <span className="mt-2 block overflow-hidden rounded-md border border-[var(--border)] bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-24 w-full object-cover" />
        </span>
      ) : null}
      {message ? (
        <span className="mt-1 block text-xs font-bold text-teal">{message}</span>
      ) : null}
    </label>
  );
}
