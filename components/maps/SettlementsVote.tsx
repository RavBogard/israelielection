import Link from "next/link";
import "./maps.css";
import e2022 from "@/public/vote-map/2022.json";
import { mapHref } from "@/lib/locality-history";
import type { VoteMapElection } from "@/lib/votemap";
import { localLeader, voteMix, OTHER_COLOR } from "@/lib/votemap-visual";
import { at, frameOf, lineOf, placeOf, places, ringsPath, viewBox, wbAreas, wbOutline, xy, type LngLat } from "./geo";

const election = e2022 as unknown as VoteMapElection;
const F = frameOf(34.6, 31.32, 35.64, 32.58);
/** Settlements in the committee's files: CBS locality codes 3400–3899 (the settlers page's classification note). */
const isSettlement = (code: number) => code >= 3400 && code <= 3899;
const KEY_VOTES = [1000, 10000];

export function settlementRows() {
  return election.rows
    .filter((r) => isSettlement(r[0]))
    .map((r) => {
      const lead = localLeader(voteMix(election, r));
      const name = lead.status === "named" ? lead.names[0] : lead.status === "tie" ? "Tie" : null;
      return { code: r[0], place: places[r[0]]?.[0] ?? `Locality ${r[0]}`, p: placeOf(r[0]), valid: r[3], leader: name, share: lead.share, color: lead.color };
    })
    .sort((a, b) => b.valid - a.valid);
}

/**
 * The settlers page lead: every settlement locality in the 2022 file as a dot sized by its valid
 * votes and coloured by its largest list, on the West Bank outline with the Green Line. A figure of
 * lists, so list colours; it opens the vote map in its leading-list view.
 */
export default function SettlementsVote() {
  const rows = settlementRows();
  const drawn = rows.filter((r) => r.p);
  const max = Math.max(...drawn.map((r) => r.valid));
  const unit = F.w / 14;
  const rad = (v: number) => unit * Math.sqrt(v / max);
  const byList = new Map<string, { n: number; color: string }>();
  for (const r of drawn) {
    const k = r.leader ?? "Cannot be established";
    byList.set(k, { n: (byList.get(k)?.n ?? 0) + 1, color: r.leader ? r.color : OTHER_COLOR });
  }
  const top = drawn[0];
  const keyAt: LngLat = [34.63, 31.5];
  const [kx, ky] = xy(keyAt);
  return (
    <figure className="map-fig st-map">
      <figcaption className="ct">The settlements in 2022: each sized by its valid votes, coloured by its largest list</figcaption>
      <div className="map-body">
        <div className="map-frame" style={{ aspectRatio: `${F.w} / ${F.h}` }}>
          <svg viewBox={viewBox(F)} role="img" aria-label={`Map of ${drawn.length} settlement localities in the West Bank, 2022. ${[...byList].map(([k, v]) => `${k} leads in ${v.n}`).join("; ")}. The largest by valid votes is ${top.place}.`}>
            <path className="m-c" d={ringsPath(wbOutline)} />
            <path className="m-green" d={lineOf(wbAreas.greenLine)} />
            {drawn.map((r) => {
              const [cx, cy] = xy(r.p!);
              return (
                <circle key={r.code} className="m-vote" cx={cx} cy={cy} r={Math.max(rad(r.valid), unit * 0.06)} style={{ fill: r.color }}>
                  <title>{`${r.place}: ${r.valid.toLocaleString("en-US")} valid votes${r.leader ? `; ${r.leader} ${((r.share ?? 0) * 100).toFixed(1)}%` : ""}`}</title>
                </circle>
              );
            })}
            {KEY_VOTES.map((v) => <circle key={v} className="m-sizekey" cx={kx} cy={ky - rad(v)} r={rad(v)} />)}
          </svg>
          {KEY_VOTES.map((v) => (
            <span key={v} className="m-lab r sz" style={at(F, [keyAt[0] + rad(KEY_VOTES[1]) / Math.cos((31.5 * Math.PI) / 180) + 0.01, keyAt[1] + 2 * rad(v)])} aria-hidden="true">{v.toLocaleString("en-US")} votes</span>
          ))}
          <span className="m-lab gl" style={at(F, [34.98, 32.25])} aria-hidden="true">Green Line</span>
        </div>
        <div className="map-side">
          <ul className="fig-key map-key">
            {[...byList].sort((a, b) => b[1].n - a[1].n).map(([k, v]) => (
              <li key={k}><i className="mk sw" style={{ background: v.color }} />{k}: largest list in {v.n}</li>
            ))}
            <li><i className="mk line" />The Green Line</li>
          </ul>
          <p className="map-go">
            <Link href={mapHref("2022", "Religious Zionism–Otzma Yehudit", null, "leader")}>Open the vote map on the leading list in each locality, 2022</Link>
          </p>
        </div>
      </div>
      <details className="cv-numbers">
        <summary>Every settlement, by valid votes</summary>
        <div className="tw">
          <table>
            <caption className="sr-only">Settlement localities in 2022 by valid votes, with the largest list</caption>
            <thead><tr><th scope="col">Locality</th><th scope="col">Valid votes</th><th scope="col">Largest list</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code}>
                  <th scope="row"><Link href={mapHref("2022", r.leader && r.leader !== "Tie" ? r.leader : "Likud", r.code)}>{r.place}</Link></th>
                  <td>{r.valid.toLocaleString("en-US")}</td>
                  <td>{r.leader ? `${r.leader}, ${((r.share ?? 0) * 100).toFixed(1)}%` : "Cannot be established from the grouped other lists"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="fig-src cs">
        Source: <a href={election.source.csv}>Central Elections Committee, results by locality, 2022</a>; settlements are the localities with CBS codes 3400–3899 ({rows.length} in the file{rows.length > drawn.length ? `, ${rows.length - drawn.length} without coordinates and not drawn` : ""}). Double-envelope votes, mostly soldiers&apos;, have no locality and are not here. Outline and Green Line: <a href={wbAreas.greenLineSource.url}>OCHA</a>.
      </p>
    </figure>
  );
}
