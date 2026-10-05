"use client";

import { useEffect, useState } from "react";
import "./embed.css";

const ORIGIN = "https://www.israelielection.org";

/** A copyable iframe snippet for one of the /embed widgets. */
export default function EmbedCode({ path, height, label }: { path: string; height: number; label: string }) {
  const [copied, setCopied] = useState(false);
  const src = `${ORIGIN}/embed/${path.replace(/^\/+/, "")}`;
  const snippet = `<iframe src="${src}" width="100%" height="${height}" style="border:0" title="${label.replace(/"/g, "&quot;")}" allow="clipboard-write" loading="lazy"></iframe>`;

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
    } catch {}
  };

  return (
    <div className="embed-code">
      <div className="bar">
        <span className="lbl">{label}</span>
        <button type="button" onClick={copy} aria-live="polite">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
