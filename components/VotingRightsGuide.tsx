import Link from "next/link";
import data from "@/data/voting-rights.json";
import "./VotingRightsGuide.css";

export default function VotingRightsGuide() {
  return <section className="voting-rights" aria-labelledby="voting-rights-title">
    <h3 id="voting-rights-title">One place, different legal statuses</h3>
    <div className="rights-rules"><div><strong>Knesset election</strong><span>Israeli citizenship · Age 18+ · Voter register</span></div><div><strong>Municipal election</strong><span>Citizen or permanent resident · Age 17+ · Local residence and voter register</span></div></div>
    <p>Read status before location. The cards compare eligibility rules; the voter register determines a person&apos;s polling entitlement.</p>
    <div className="rights-grid">{data.rows.map(r=><article key={r.id} className="rights-card"><h4>{r.status}</h4><p className="rights-place">{r.location}</p><dl><div><dt>Knesset</dt><dd data-kind={r.nationalKind}>{r.national}</dd></div><div><dt>Israeli municipal / local</dt><dd data-kind={r.municipalKind}>{r.municipal}</dd></div></dl><p>{r.detail}</p></article>)}</div>
    <p className="rights-sources">Rules checked October 5, 2026: <a href={data.nationalSource}>Basic Law: The Knesset, §5</a>; <a href={data.registrySource}>CEC voter-register guidance (2022 election)</a>; <a href={data.statusSource}>government explanation of national and municipal status rules</a>; <a href={data.municipalSource}>Interior Ministry local-register conditions (2025)</a>; <a href={data.contextSource}>IDI on citizenship and residency</a>. Age is measured on the relevant election day. See <Link href="/how-it-works/voting">how to vote</Link> for voting locations and exceptions.</p>
  </section>;
}
