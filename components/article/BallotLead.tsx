import Link from "next/link";
import "@/components/BallotDirectory.css";
import { ballotLists } from "@/lib/ballot";
import { allCharts } from "@/lib/articles";

const ENVELOPE = (
  <svg viewBox="0 0 120 80" aria-hidden="true">
    <rect className="bl-slip" x="32" y="3" width="56" height="44" />
    <rect className="bl-paper" x="8" y="26" width="104" height="50" />
    <path className="bl-ink" d="M8 26 L60 54 L112 26" />
  </svg>
);
const BOX = (
  <svg viewBox="0 0 120 80" aria-hidden="true">
    <rect className="bl-cell" x="16" y="38" width="88" height="40" />
    <rect className="bl-paper" x="10" y="32" width="100" height="8" />
    <rect className="bl-slot" x="44" y="34.5" width="32" height="3" />
    <g transform="rotate(-6 60 16)">
      <rect className="bl-paper" x="42" y="2" width="36" height="26" />
      <path className="bl-ink" d="M42 2 L60 14 L78 2" />
    </g>
  </svg>
);
const DOUBLE = (
  <svg viewBox="0 0 120 80" aria-hidden="true">
    <rect className="bl-paper soft" x="28" y="6" width="64" height="40" />
    <path className="bl-soft" d="M28 6 L60 26 L92 6" />
    <rect className="bl-paper" x="8" y="26" width="104" height="50" />
    <path className="bl-ink" d="M8 26 L60 54 L112 26" />
  </svg>
);

/**
 * The voting guide opens with the act itself, drawn: the tray of slips (one per list, Hebrew letters,
 * as in the ballot directory), one slip lifted face down, sealed in an envelope, dropped in the box.
 * The double-envelope share is the guide's own figure for 2022.
 */
export default function BallotLead() {
  const env = allCharts()["voting.envelopes"];
  const last = env?.rows.at(-1);
  return (
    <figure className="ballot-lead">
      <figcaption className="ct">Casting a vote: one slip, one envelope, one box</figcaption>
      <ol className="bl-steps">
        <li className="bl-s1">
          <p className="bl-n"><b>1</b>Behind the screen, take one slip for the chosen list</p>
          <div className="bl-tray">
            <ol className="ballot-directory bl-wall" aria-label={`The ${ballotLists.length} slips on the published roster, by their ballot letters`}>
              {ballotLists.map((l) => (
                <li key={l.id}>
                  <span className="bd-slip" title={l.name}><span className="bd-letters" lang="he" dir="rtl">{l.letters}</span></span>
                </li>
              ))}
            </ol>
            <span className="bl-lift" aria-hidden="true"><span>One slip, face down</span></span>
          </div>
        </li>
        <li>
          <p className="bl-n"><b>2</b>Seal it in the envelope</p>
          {ENVELOPE}
        </li>
        <li>
          <p className="bl-n"><b>3</b>Drop the envelope in the ballot box</p>
          {BOX}
        </li>
      </ol>
      {last && (
        <div className="bl-double">
          {DOUBLE}
          <p>
            A voter away from their own polling station seals the envelope inside a second, outer one. In {last.label.replace(/^\w+ /, "")}, <b>{last.value}%</b> of valid votes came in double envelopes, counted after the rest.
          </p>
        </div>
      )}
      <p className="fig-src cs">
        Procedure: <a href="https://www.ynetnews.com/article/rjxzpztvo">Ynet, Oct 31, 2022</a>; a slip with writing on it, a torn slip, or an envelope holding more than one slip is disqualified. Slips: the {ballotLists.length} lists on the Central Elections Committee&apos;s published roster, in roster order (<Link href="/ballot">the ballot directory</Link>). Double envelopes: {env ? <a href={env.url}>{env.source}</a> : null}, computed.
      </p>
    </figure>
  );
}
