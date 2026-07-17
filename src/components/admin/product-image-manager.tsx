"use client";

import { useMemo, useState } from "react";
import { GripVertical, Star, Trash2, UploadCloud } from "lucide-react";

type ImageRow = {
  url: string;
  alt: string;
  sortOrder: number;
  variantKey: string;
  key?: string;
};

export function ProductImageManager({
  initialImages = [],
}: {
  initialImages?: ImageRow[];
}) {
  const [images, setImages] = useState<ImageRow[]>(
    initialImages.map((image, index) => ({ ...image, sortOrder: index })),
  );
  const [message, setMessage] = useState("");
  const ordered = useMemo(
    () => images.map((image, index) => ({ ...image, sortOrder: index })),
    [images],
  );

  async function uploadFiles(files: FileList | File[]) {
    setMessage("");
    const next: ImageRow[] = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.set("file", file);
      form.set("purpose", "product");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      const body = (await response.json()) as {
        ok: boolean;
        url?: string;
        key?: string;
        message?: string;
      };
      if (!response.ok || !body.ok || !body.url) {
        setMessage(body.message || "Upload failed");
        continue;
      }
      next.push({
        url: body.url,
        key: body.key,
        alt: file.name.replace(/\.[^.]+$/, ""),
        sortOrder: images.length + next.length,
        variantKey: "",
      });
    }
    if (next.length) setImages((current) => [...current, ...next]);
  }

  async function removeImage(index: number) {
    const image = images[index];
    setImages((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
    if (image.key) {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: image.key }),
      }).catch(() => undefined);
    }
  }

  function move(index: number, direction: -1 | 1) {
    setImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-navy">Images</h2>
          <p className="mt-1 text-sm text-slate-500">
            First image is used as the primary product image.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-navy px-4 py-2 font-black text-white">
          <UploadCloud className="h-4 w-4" />
          Upload
          <input
            type="file"
            accept="image/*,.ico"
            multiple
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) void uploadFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      <div
        className="mt-4 rounded-lg border border-dashed border-[var(--border)] bg-cream p-5 text-center text-sm font-bold text-slate-500"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void uploadFiles(event.dataTransfer.files);
        }}
      >
        Drag images here or use Upload.
      </div>
      {message ? (
        <p className="mt-3 text-sm font-bold text-coral">{message}</p>
      ) : null}
      <div className="mt-4 grid gap-3">
        {ordered.map((image, index) => (
          <div
            key={`${image.url}-${index}`}
            className="grid gap-3 rounded-md border border-[var(--border)] p-3 md:grid-cols-[92px_1fr_auto]"
          >
            <div className="relative aspect-square overflow-hidden rounded-md bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.alt}
                className="h-full w-full object-contain"
              />
              {index === 0 ? (
                <span className="absolute left-1 top-1 rounded-full bg-sun p-1 text-navy">
                  <Star className="h-3.5 w-3.5 fill-current" />
                </span>
              ) : null}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <input type="hidden" name="imageUrl" value={image.url} />
              <input
                type="hidden"
                name="imageSortOrder"
                value={image.sortOrder}
              />
              <label className="text-sm font-bold text-slate-600">
                Alt text
                <input
                  name="imageAlt"
                  value={image.alt}
                  onChange={(event) =>
                    setImages((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, alt: event.target.value }
                          : item,
                      ),
                    )
                  }
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] px-3"
                />
              </label>
              <label className="text-sm font-bold text-slate-600">
                Variant key
                <input
                  name="imageVariantKey"
                  value={image.variantKey}
                  onChange={(event) =>
                    setImages((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, variantKey: event.target.value }
                          : item,
                      ),
                    )
                  }
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] px-3"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-md border border-[var(--border)]"
                onClick={() => move(index, -1)}
                aria-label="Move image earlier"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-md border border-[var(--border)] text-coral"
                onClick={() => void removeImage(index)}
                aria-label="Delete image"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
