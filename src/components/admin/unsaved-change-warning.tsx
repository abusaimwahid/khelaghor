"use client";

import { useEffect } from "react";

export function UnsavedChangeWarning({ formId }: { formId: string }) {
  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;
    let dirty = false;
    const markDirty = () => {
      dirty = true;
    };
    const markClean = () => {
      dirty = false;
    };
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    form.addEventListener("input", markDirty);
    form.addEventListener("change", markDirty);
    form.addEventListener("submit", markClean);
    window.addEventListener("beforeunload", warn);
    return () => {
      form.removeEventListener("input", markDirty);
      form.removeEventListener("change", markDirty);
      form.removeEventListener("submit", markClean);
      window.removeEventListener("beforeunload", warn);
    };
  }, [formId]);
  return null;
}
