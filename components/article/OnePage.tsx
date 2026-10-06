import Link from "next/link";
import SeatBar from "@/components/SeatBar";
import { ballotLists } from "@/lib/ballot";
import { averagePoll, parties } from "@/lib/data";
import { LIMITS as L, RESULTS_TO_DISSOLUTION } from "@/lib/formation";
import { partyColor } from "@/lib/party-colors";
import { seatFigure } from "@/lib/polls";
import rights from "@/data/voting-rights.json";

const seatsOf = (id: string | null) => (id ? averagePoll.results[id]?.seats ?? 0 : 0);
const BLOC_ORDER = ["net", "mid", "opp", "arab"];
/** The formation clock's stages in order, as the government page draws them: who acts, and for how long. */
export const CLOCK: { kind: "president" | "nominee" | "discretion" | "knesset"; days: number; label: string }[] = [
  { kind: "president", days: L.assignFirst, label: "The president picks a first nominee" },
  { kind: "nominee", days: L.firstPeriod, label: "First nominee" },
  { kind: "discretion", days: L.firstExtension, label: "Extension, if granted" },
  { kind: "president", days: L.assignSecond, label: "A second nominee" },
  { kind: "nominee", days: L.secondPeriod, label: "Second nominee" },
  { kind: "knesset", days: L.knessetRequest, label: "61 members may name someone" },
  { kind: "president", days: L.assignThird, label: "The president assigns them" },
  { kind: "nominee", days: L.thirdPeriod, label: "That member" },
];
const MINI_RIGHTS = ["citizen", "permanent", "settler", "palestinian"];
const KIND = { yes: "Can vote", no: "Cannot vote", status: "Depends on status" } as Record<string, string>;

export type Panel = { href: string; title: string };

/**
 * "The election on one page": four small figures, in the order things happen, each the miniature of
 * the figure its guide opens with: the slips on the ballot and how many pass the threshold, the 120
 * seats and the 61 line, the formation clock in days, and who has the vote.
 */
export default function OnePage({ voting, seats, forming, whoVotes }: { voting: Panel; seats: Panel; forming: Panel; whoVotes: Panel }) {
  const polled = ballotLists.filter((l) => seatsOf(l.profile) > 0).length;
  const listSeats = parties
    .filter((p) => seatsOf(p.id) > 0)
    .sort((a, b) => BLOC_ORDER.indexOf(a.bloc) - BLOC_ORDER.indexOf(b.bloc) || seatsOf(b.id) - seatsOf(a.id));
  const rows = MINI_RIGHTS.map((id) => rights.rows.find((r) => r.id === id)!).filter(Boolean);
  return (
    <section className="onepage" aria-labelledby="onepage-h">
      <h2 id="onepage-h" className="op-h">The election on one page</h2>
      <ol className="op-panels">
        <li>
          <h3><Link href={voting.href}><b>1</b>{voting.title}</Link></h3>
          <ol className="op-slips" aria-hidden="true">
            {ballotLists.map((l) => <li key={l.id} className={seatsOf(l.profile) > 0 ? "in" : "out"} lang="he" dir="rtl">{l.letters}</li>)}
          </ol>
          <p className="op-read"><b>{ballotLists.length}</b> lists on the ballot, one paper slip each. <b>{polled}</b> pass the 3.25% threshold in the polling average; the rest, dashed, poll below it or are not polled.</p>
        </li>
        <li>
          <h3><Link href={seats.href}><b>2</b>{seats.title}</Link></h3>
          <div className="op-seats">
            <span className="op-61" style={{ left: `${(61 / 120) * 100}%` }} aria-hidden="true">61</span>
            <SeatBar size="m" segments={listSeats.map((p) => ({ key: p.id, seats: seatsOf(p.id), color: partyColor(p.id), title: `${p.name}: ${seatFigure(seatsOf(p.id))}` }))} label={`120 seats in the polling average, list by list: ${listSeats.map((p) => `${p.name} ${seatFigure(seatsOf(p.id))}`).join(", ")}. A majority is 61.`} />
          </div>
          <p className="op-read">The 120 seats are shared in proportion among the lists that pass. A government needs the Knesset&apos;s confidence, and <b>61</b> is a majority.</p>
        </li>
        <li>
          <h3><Link href={forming.href}><b>3</b>{forming.title}</Link></h3>
          <div className="op-clock" role="img" aria-label={`The longest path the law allows: ${CLOCK.map((c) => `${c.label}, ${c.days} days`).join("; ")}; ${RESULTS_TO_DISSOLUTION} days in all.`}>
            <span className="op-bar">
              {CLOCK.map((c, i) => <i key={i} className={c.kind} style={{ width: `${(c.days / RESULTS_TO_DISSOLUTION) * 100}%` }} title={`${c.label}: ${c.days} days`} />)}
            </span>
            <span className="op-axis" aria-hidden="true"><span>Day 0</span><span>Day {RESULTS_TO_DISSOLUTION}</span></span>
          </div>
          <p className="op-read">Up to <b>{RESULTS_TO_DISSOLUTION} days</b> from the official results: {L.firstPeriod} days for the first nominee, up to {L.firstExtension} more, {L.secondPeriod} for a second, then {L.knessetRequest} for the Knesset to name someone. If all fail, a new election.</p>
        </li>
        <li>
          <h3><Link href={whoVotes.href}><b>4</b>{whoVotes.title}</Link></h3>
          <table className="op-rights">
            <caption className="sr-only">Who can vote in which election</caption>
            <thead><tr><th scope="col"><span className="sr-only">Status</span></th><th scope="col">Knesset</th><th scope="col">Municipal</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row">{r.status}</th>
                  <td className={r.nationalKind}><span className="sr-only">{KIND[r.nationalKind]}</span></td>
                  <td className={r.municipalKind}><span className="sr-only">{KIND[r.municipalKind]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="op-read">Citizenship decides the Knesset vote: solid can vote, hatched cannot, grey depends on the person&apos;s status.</p>
        </li>
      </ol>
      <p className="fig-src op-src">Seats: the current polling average. Slips: the Central Elections Committee&apos;s published roster. Clock: Basic Law: The Government, articles 7 to 10. Voting rights: the sources on each guide.</p>
    </section>
  );
}
