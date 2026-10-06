import Link from "next/link";
import data from "@/data/voting-rights.json";
import "./VotingRightsGuide.css";

const KIND_LABEL: Record<string, string> = { yes: "Can vote", no: "Cannot vote", status: "Depends on status" };

/**
 * Who can vote in which election, as a matrix: each legal status down the side, the Knesset and
 * Israeli municipal elections across, each cell black when the status carries the vote, hatched
 * when it does not, and grey when it depends on the person's actual status.
 */
export default function VotingRightsGuide() {
  return (
    <figure className="voting-rights" aria-labelledby="voting-rights-title">
      <figcaption id="voting-rights-title" className="vr-h">One place, different legal statuses: who can vote in which election</figcaption>
      <p className="vr-key" aria-hidden="true">
        {Object.entries(KIND_LABEL).map(([k, l]) => (
          <span key={k}><i className={`vr-k ${k}`} />{l}</span>
        ))}
      </p>
      <table className="vr-table">
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Knesset<span>Citizenship, 18+, on the register</span></th>
            <th scope="col">Israeli municipal<span>Citizen or permanent resident, 17+, local register</span></th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.id}>
              <th scope="row">
                <b>{r.status}</b>
                <span className="vr-place">{r.location}</span>
                <span className="vr-detail">{r.detail}</span>
              </th>
              <td className={`vr-cell ${r.nationalKind}`}><span className="sr-only">{KIND_LABEL[r.nationalKind]}: </span>{r.national}</td>
              <td className={`vr-cell ${r.municipalKind}`}><span className="sr-only">{KIND_LABEL[r.municipalKind]}: </span>{r.municipal}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="vr-src">
        Rules checked October 5, 2026: <a href={data.nationalSource}>Basic Law: The Knesset, §5</a>; <a href={data.registrySource}>CEC voter-register guidance (2022 election)</a>;{" "}
        <a href={data.statusSource}>government explanation of national and municipal status rules</a>; <a href={data.municipalSource}>Interior Ministry local-register conditions (2025)</a>;{" "}
        <a href={data.contextSource}>IDI on citizenship and residency</a>. Age is measured on the relevant election day; the voter register decides each person&apos;s entitlement. See{" "}
        <Link href="/how-it-works/voting">how to vote</Link> for voting locations and exceptions.
      </p>
    </figure>
  );
}
