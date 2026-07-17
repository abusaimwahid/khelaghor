"use client";

import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import type { UploadPurpose } from "@/server/storage";

type Item = { url: string; key: string; name: string; type: string };

export function UploadField({ name, purpose, label, maxFiles = 5, accept = "image/*" }: {
  name: string; purpose: UploadPurpose; label: string; maxFiles?: number; accept?: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  async function upload(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files).slice(0, maxFiles - items.length);
    setError(""); setProgress(1);
    const added: Item[] = [];
    for (let index = 0; index < selected.length; index++) {
      const form = new FormData(); form.set("file", selected[index]); form.set("purpose", purpose);
      const response = await fetch("/api/upload", { method: "POST", body: form });
      const body = await response.json() as { ok: boolean; url?: string; key?: string; mimeType?: string; message?: string };
      if (!response.ok || !body.url || !body.key) { setError(body.message || "Upload failed. Please retry."); break; }
      added.push({ url: body.url, key: body.key, name: selected[index].name, type: body.mimeType || selected[index].type });
      setProgress(Math.round(((index + 1) / selected.length) * 100));
    }
    setItems((current) => [...current, ...added]); setProgress(0);
  }
  return <div className="mt-4">
    <input type="hidden" name={name} value={items.map((item) => item.url).join(",")} />
    <span className="block font-bold text-navy">{label}</span>
    <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void upload(e.dataTransfer.files); }} className="mt-2 flex min-h-24 w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-[var(--border)] bg-white p-4 font-bold text-navy">
      <UploadCloud className="h-5 w-5" /> Choose files or drop here
    </button>
    <input ref={input} type="file" multiple accept={accept} className="sr-only" aria-label={label} onChange={(e) => void upload(e.target.files)} />
    {progress ? <div className="mt-2 h-2 overflow-hidden rounded bg-slate-100" role="progressbar" aria-valuenow={progress}><div className="h-full bg-teal" style={{ width: `${progress}%` }} /></div> : null}
    {error ? <p className="mt-2 text-sm font-bold text-red-700" role="alert">{error}</p> : null}
    <div className="mt-2 grid gap-2 sm:grid-cols-3">{items.map((item) => <div key={item.key} className="relative overflow-hidden rounded-md border bg-white p-2">
      {item.type.startsWith("image/") ? <Image src={item.url} alt="Upload preview" width={240} height={80} unoptimized className="h-20 w-full object-cover" /> : <span className="flex h-20 items-center justify-center"><FileText /></span>}
      <span className="block truncate text-xs">{item.name}</span><button type="button" aria-label={`Remove ${item.name}`} className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-full bg-white shadow" onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))}><X className="h-4 w-4" /></button>
    </div>)}</div>
    <p className="mt-1 text-xs text-slate-500">Up to {maxFiles} files.</p>
  </div>;
}
