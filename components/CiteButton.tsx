"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/lang";
import chrome from "@/lib/i18n/chrome";
import "./cite.css";

/** Copies a ready-made citation to the clipboard and confirms it in words. The words default to the page's edition. */
export default function CiteButton({ text, label, copied, failed }: { text: string; label?: string; copied?: string; failed?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const t = chrome[useLang()].cite;

  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2500);
    return () => clearTimeout(t);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  return (
    <span className="cite">
      <button type="button" className="cite-btn" onClick={copy} title={text}>
        {label ?? t.label}
      </button>
      <span className="cite-status" role="status" aria-live="polite">
        {state === "copied" ? copied ?? t.copied : state === "failed" ? `${failed ?? t.failed} ${text}` : ""}
      </span>
    </span>
  );
}
