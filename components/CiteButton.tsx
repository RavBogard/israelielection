"use client";

import { useEffect, useState } from "react";
import "./cite.css";

/** Copies a ready-made citation to the clipboard and confirms it in words. */
export default function CiteButton({ text, label = "Cite this" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

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
        {label}
      </button>
      <span className="cite-status" role="status" aria-live="polite">
        {state === "copied" ? "Copied" : state === "failed" ? `Copy failed. ${text}` : ""}
      </span>
    </span>
  );
}
