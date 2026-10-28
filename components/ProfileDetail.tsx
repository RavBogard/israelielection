"use client";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { useSeatContext } from "./seat-context/SeatContextProvider";
import ListStatusChip from "./list-status/ListStatusChip";
import { useListShares } from "./list-status/ListSharesProvider";
import { shareOf } from "@/lib/list-status";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import Link from "next/link";
import { partyColor } from "@/lib/party-colors";
import { blocLabel } from "@/lib/data";
import { lettersOf } from "@/lib/letters";
import { listSeats } from "@/lib/list-seats";
import { seatFigure } from "@/lib/polls";
import type { Party, Sourced } from "@/lib/types";

const Src = ({ s }: { s: string | null }) => (s ? <> <span className="s">({s})</span></> : null);

function Items({ items }: { items: Sourced[] }) {
  return (
    <ul>
      {items.map((x, i) => (
        <li key={i}>
          {x.text}
          <Src s={x.source} />
        </li>
      ))}
    </ul>
  );
}

/** The list's seats in the current average, in one line. */
function seatsLine(p: Party): string {
  const s = listSeats(p.id);
  if (!s.n) return p.status ?? "No poll figures";
  if (s.k === 0) return `Below the threshold in all ${s.n} polls that reported it`;
  if (s.nearThreshold) return `Below: passes in ${s.k} of ${s.n} polls, ${seatFigure(s.passing!)} seats where it passes`;
  return `${s.text}, scaled to 120 seats; passes in ${s.k} of ${s.n} polls`;
}

type Props = {
  party: Party;
  headingId?: string;
  context?: SharedSeatContext|null;
};

/**
 * A short preview of a list for the Party Map panel and the Coalition Builder drawer: who it is,
 * its seats, its coalition pledges, and a prominent way into the full profile page, which carries
 * everything else (stances, every poll, the names on the list, bios, sources).
 */
export default function ProfileDetail({ party: p, headingId,context:initial }: Props) {
  const {context,refreshFailed}=useSeatContext(initial,!!initial);
  const shares = useListShares();
  const color = partyColor(p.id);
  const countSeats = context ? context.pointSeats[p.id] ?? 0 : 0;
  const chip = context ? <ListStatusChip seats={countSeats} seatStatus={context.seatStatus} pct={shareOf({ party: p.id, letters: lettersOf[p.id] }, shares, context)} lang="en" /> : null;
  return (
    <div className="profile preview" style={{ ["--qc" as string]: color }}>
      <div className="ident">
        {lettersOf[p.id] && (
          <span className="letters" lang="he" dir="rtl" title={`Ballot letters: ${lettersOf[p.id]}`}>
            {lettersOf[p.id]}
          </span>
        )}
        <span className="bchip">
          <span className="sw" style={{ background: color }} />
          {blocLabel[p.bloc]}
        </span>
        <h2 className="pname" id={headingId}>
          {p.name}
        </h2>
      </div>
      <Link className="open-profile" href={`/parties/${p.id}`}>
        Open the full profile
      </Link>
      <dl className="kv">
        <dt>Leader</dt>
        <dd>{p.leader}</dd>
        <dt>{context ? LIFECYCLE.en[context.basis] : "Seats, polling average"}</dt>
        <dd>{!context&&refreshFailed ? LIFECYCLE.en.sourceUnavailable : context ? (countSeats > 0 ? <>{countSeats} seats · {LIFECYCLE.en[context.seatStatus]} {chip}</> : chip) : seatsLine(p)}</dd>
      </dl>
      {p.who.length > 0 && (
        <div className="sec">
          <p className="lbl">Who they are</p>
          <Items items={p.who.slice(0, 2)} />
        </div>
      )}
      {p.pledges && (
        <div className="sec">
          <p className="lbl">Pledges to be tested in coalition talks</p>
          <Items items={p.pledges} />
        </div>
      )}
      <p className="fig-src">
        The <Link href={`/parties/${p.id}`}>full profile</Link> has where {p.name} stands on each issue, its seats in every poll, the names on its list,
        bios and sources.
      </p>
    </div>
  );
}
