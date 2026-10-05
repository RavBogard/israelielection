import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import packets from "@/data/teaching-packets.json";
import "@/components/article/article.css";
import "@/components/teaching-packets.css";
export const dynamicParams = false;
export function generateStaticParams() { return packets.packets.flatMap((p) => ["learner", "facilitator"].map((role) => ({ id: p.id, role }))); }
type Params = { params: Promise<{ id: string; role: string }> };
export async function generateMetadata({ params }: Params): Promise<Metadata> { const { id, role } = await params; const packet = packets.packets.find((p) => p.id === id); return { title: packet ? `${packet.title}: ${role === "facilitator" ? "facilitator notes" : "learner sheet"}` : "Teaching packet" }; }
export default async function Page({ params }: Params) {
  const { id, role } = await params;
  const packet = packets.packets.find((p) => p.id === id);
  if (!packet || (role !== "learner" && role !== "facilitator")) notFound();
  const sections = packet[role];
  return <div className="wrap article-page packet-page"><article className="article">
    <p className="packet-controls"><Link href="/teach#packets">Teaching packets</Link> · <a href={`/teach/${id}-${role}.pdf`} download>Download this {role === "learner" ? "learner sheet" : "facilitator guide"} (PDF)</a> · <Link href={`/teach/packets/${id}/${role === "learner" ? "facilitator" : "learner"}`}>Open {role === "learner" ? "facilitator notes" : "learner sheet"}</Link></p>
    <h1>{packet.title}</h1><p className="dek">{role === "learner" ? "Learner sheet" : "Facilitator notes"} · {packet.minutes} minutes</p><p className="checked">Prepared {packets.checked}. Hypothetical exercises are labeled; source evidence dates appear below.</p>
    <p><b>For:</b> {packet.audience}</p><p><b>Before you start:</b> {packet.prerequisites}</p><h2>Learning objectives</h2><ul>{packet.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
    <div className="body">{sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{"paragraphs" in section && section.paragraphs?.map((p) => <p key={p}>{p}</p>)}{"prompts" in section && section.prompts?.map((prompt) => <div key={prompt} className="packet-prompt"><p>{prompt}</p>{role === "learner" && <div className="answer-space" aria-label="Space for your written answer" />}</div>)}</section>)}</div>
    <h2>Sources and next steps</h2><ul className="packet-sources">{packet.sources.map((source) => <li key={source.href}><a href={source.href}>{source.title}</a> — {source.date}</li>)}</ul><p className="packet-attribution">{packets.attribution} <a href="https://creativecommons.org/licenses/by-nc/4.0/" rel="license">License</a>.</p>
  </article></div>;
}
