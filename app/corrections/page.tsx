import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import CorrectionReport from "@/components/CorrectionReport";
import corrections from "@/data/corrections.json";
import channel from "@/data/correction-channel.json";
import type { Correction } from "@/lib/corrections";
import { NAV } from "@/lib/site";
import { longDate } from "@/lib/format";
import "@/components/interactives.css";
import "@/components/corrections.css";
import PageHead from "@/components/PageHead";
export const metadata: Metadata = { title: "Media inquiries and corrections", description: "Contact Rabbi Daniel Bogard for media inquiries or send an evidence-based correction without an account. Read substantive corrections and their sources." };
/** A corrected page by its name in the site catalog, or its address when it has none. */
const pageName = (href: string) => NAV.find((n) => n.href === href.split("#")[0])?.label ?? href;

export default function Page() {
  const entries = corrections.entries as Correction[];
  return <div className="wrap ix"><PageHead title="Media inquiries and corrections" standfirst="Contact Rabbi Daniel Bogard about this site, or point out a mistake." />
    <section id="media" className="media-inquiries" aria-labelledby="media-title"><h2 id="media-title">Media inquiries</h2><p>For interviews, background or questions about this site, email {channel.reviewer} at <a href={`mailto:${channel.email}?subject=${encodeURIComponent("Media inquiry: Israel Votes 2026")}`}>{channel.email}</a>. Include your outlet, topic and deadline if applicable.</p><p className="note">To report a factual error, <a href="#report">prepare a correction below</a>.</p></section>
    <div className="correction-register"><p>{channel.reviewer} is responsible for corrections. Automated poll validation checks structure and consistency; source-link checks screen briefings. These checks do not establish factual truth or amount to human review. <Link href="/about">Read the full method</Link>.</p>
      <p className="note">Entries marked Codex describe an automated source review of the change and cited evidence, not a separate human fact-check.</p><h2>Substantive corrections</h2>{entries.length === 0 ? <p>No substantive corrections have been entered in this register yet. That is not a claim that every page is error-free.</p> : entries.map((entry) => <article key={entry.id} id={entry.id}><h3><Link href={entry.page}>{pageName(entry.page)}</Link>, {longDate(entry.date)}</h3><dl><dt>Previously</dt><dd>{entry.before}</dd><dt>Corrected to</dt><dd>{entry.after}</dd></dl><p>{entry.explanation}</p><ul>{entry.evidence.map((e) => <li key={e.url}><a href={e.url}>{e.title}</a></li>)}</ul><p className="fig-src">Source review: {entry.reviewedBy}.</p></article>)}
    </div><Suspense fallback={<p>Loading the correction report…</p>}><CorrectionReport /></Suspense>
  </div>;
}
