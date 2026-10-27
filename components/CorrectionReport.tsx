"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import channel from "@/data/correction-channel.json";
import {
  correctionEmail,
  reportPage,
  reportAddress,
  reportText,
} from "@/lib/corrections";
import { correctionText } from "@/lib/i18n/corrections";
import type { Lang } from "@/lib/i18n";
import "./corrections.css";
export default function CorrectionReport({ lang = "en" }: { lang?: Lang }) {
  const query = useSearchParams(),
    source = reportPage(query.get("url") ?? "/"),
    t = correctionText(lang);
  const [editedPage, setEditedPage] = useState<{
      from: string;
      page: string;
    } | null>(null),
    page = reportAddress(source, editedPage),
    [claim, setClaim] = useState(""),
    [proposed, setProposed] = useState(""),
    [evidence, setEvidence] = useState(""),
    [status, setStatus] = useState("");
  const report = { page, claim, proposed, evidence },
    text = reportText(report, lang),
    email = correctionEmail(channel.email, report, lang),
    ready = claim.trim().length > 0,
    github = `${channel.github}?title=${encodeURIComponent(t.subject + ": " + claim.slice(0, 80))}&body=${encodeURIComponent(text)}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(t.copyDone);
    } catch {
      setStatus(t.copyFail);
    }
  }
  function download() {
    const href = URL.createObjectURL(
        new Blob([text], { type: "text/plain;charset=utf-8" }),
      ),
      a = document.createElement("a");
    a.href = href;
    a.download = "election-correction.txt";
    a.click();
    URL.revokeObjectURL(href);
    setStatus(t.downloaded);
  }
  return (
    <section
      id="report"
      className="correction-report"
      aria-labelledby="report-title"
    >
      <h2 id="report-title">{t.report}</h2>
      <p>
        {t.responsible}: <bdi lang="en">{channel.reviewer}</bdi>.{" "}
        {t.draftNotice}
      </p>
      {email && (
        <p className="fig-note">
          {t.emailNote} <bdi dir="ltr">{channel.email}</bdi>.
        </p>
      )}
      <label>
        {t.page}
        <input
          type="url"
          dir="ltr"
          maxLength={2048}
          value={page}
          onChange={(event) =>
            setEditedPage({ from: source, page: event.target.value })
          }
        />
      </label>
      <label>
        {t.claim}
        <textarea
          dir="auto"
          rows={3}
          maxLength={2000}
          value={claim}
          onChange={(event) => setClaim(event.target.value)}
        />
      </label>
      <label>
        {t.proposed}
        <textarea
          dir="auto"
          rows={3}
          maxLength={2000}
          value={proposed}
          onChange={(event) => setProposed(event.target.value)}
        />
      </label>
      <label>
        {t.evidence}
        <textarea
          dir="auto"
          rows={3}
          maxLength={4000}
          value={evidence}
          onChange={(event) => setEvidence(event.target.value)}
        />
      </label>
      <p className="fig-note">{t.privacy}</p>
      <div className="correction-actions">
        <button type="button" disabled={!ready} onClick={copy}>
          {t.copy}
        </button>
        <button type="button" disabled={!ready} onClick={download}>
          {t.download}
        </button>
        {ready && email && (
          <a href={email} onClick={() => setStatus(t.opened)}>
            {t.openEmail}
          </a>
        )}
        {ready && (
          <a href={github} target="_blank" rel="noopener noreferrer">
            {t.github}
          </a>
        )}
      </div>
      {!email && <p className="fig-note">{t.noEmail}</p>}
      <p role="status" aria-live="polite">
        {status}
      </p>
      <details>
        <summary>{t.preview}</summary>
        <pre className="report-preview" dir="auto">
          {text}
        </pre>
      </details>
    </section>
  );
}
