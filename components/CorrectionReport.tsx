"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import channel from "@/data/correction-channel.json";
import { correctionEmail, reportPage, reportAddress, reportText } from "@/lib/corrections";
import "./corrections.css";
export default function CorrectionReport() {
  const query = useSearchParams();
  const source=reportPage(query.get("url")??"/");
  const [editedPage,setEditedPage]=useState<{from:string;page:string}|null>(null);
  const page=reportAddress(source,editedPage);
  const [claim, setClaim] = useState("");
  const [proposed, setProposed] = useState("");
  const [evidence, setEvidence] = useState("");
  const [status, setStatus] = useState("");
  const report = { page, claim, proposed, evidence };
  const text = reportText(report);
  const email = correctionEmail(channel.email, report);
  const ready = claim.trim().length > 0;
  const github = `${channel.github}?title=${encodeURIComponent("Correction: " + claim.slice(0, 80))}&body=${encodeURIComponent(text)}`;
  async function copy() { try { await navigator.clipboard.writeText(text); setStatus("Report copied. It has not been sent."); } catch { setStatus("Copy is unavailable. Use Download report, or select the report text below."); } }
  function download() {
    const href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = href; a.download = "election-correction.txt"; a.click(); URL.revokeObjectURL(href);
    setStatus("Report downloaded. It has not been sent.");
  }
  return <section id="report" className="correction-report" aria-labelledby="report-title">
    <h2 id="report-title">Report a correction</h2><p>Point to a specific claim and the evidence that would correct it. {channel.reviewer} is responsible for reviewing corrections. Your report stays on your device until you choose to send it.</p>
    {email && <p className="fig-note">No account is required. Fill in the claim, then open an email draft to <b>{channel.email}</b>. Review and send it in your email app.</p>}
    <label>Page address<input type="url" maxLength={2048} value={page} onChange={(e) => setEditedPage({from:source,page:e.target.value})} /></label>
    <label>Claim or number in question<textarea rows={3} maxLength={2000} value={claim} onChange={(e) => setClaim(e.target.value)} /></label>
    <label>What should it say?<textarea rows={3} maxLength={2000} value={proposed} onChange={(e) => setProposed(e.target.value)} /></label>
    <label>Supporting source and explanation<textarea rows={3} maxLength={4000} value={evidence} onChange={(e) => setEvidence(e.target.value)} /></label>
    <p className="fig-note">Include a source link if you have one. Avoid personal or confidential information; GitHub reports are public.</p>
    <div className="correction-actions"><button type="button" disabled={!ready} onClick={copy}>Copy report</button><button type="button" disabled={!ready} onClick={download}>Download report</button>{ready && email && <a href={email} onClick={() => setStatus("Your email app opens a draft. Review it and send it there; this page cannot confirm delivery.")}>Open correction email draft</a>}{ready && <a href={github} target="_blank" rel="noopener">Open GitHub report (account required)</a>}</div>
    {!email && <p className="fig-note">You can prepare, copy or download a report without an account. Sending through the current GitHub channel requires an account.</p>}
    <p role="status" aria-live="polite">{status}</p>
    <details><summary>Preview the report text</summary><pre className="report-preview">{text}</pre></details>
  </section>;
}
