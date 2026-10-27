"use client";

import { useEffect, useState } from "react";
import { editionPath, type Lang } from "@/lib/i18n";
import { EMBEDS } from "@/lib/i18n/embeds";
import "./embed.css";

const ORIGIN = "https://www.israelielection.org";

/** A copyable iframe snippet for one of the /embed widgets. */
export default function EmbedCode({
  path,
  height,
  label,
  lang = "en",
}: {
  path: string;
  height: number;
  label: string;
  lang?: Lang;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const t = EMBEDS[lang];
  const src = `${ORIGIN}${editionPath(`/embed/${path.replace(/^\/+/, "")}`, lang) ?? `/embed/${path.replace(/^\/+/, "")}`}`;
  const snippet = `<iframe src="${src}" width="100%" height="${height}" style="border:0" title="${label.replace(/"/g, "&quot;")}" allow="clipboard-write" loading="lazy"></iframe>`;

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setFailed(false);
      setCopied(true);
    } catch {
      setFailed(true);
    }
  };

  return (
    <div className="embed-code">
      <div className="bar">
        <span className="lbl">{label}</span>
        <button type="button" onClick={copy} aria-live="polite">
          {copied ? t.copied : t.copy}
        </button>
      </div>
      {failed && <p role="status">{t.copyFailed}</p>}
      <pre>
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
