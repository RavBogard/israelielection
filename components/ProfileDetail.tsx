import Link from "next/link";
import { partyColor } from "@/lib/party-colors";
import { averagePoll, blocLabel, mainPolls } from "@/lib/data";
import { fmt } from "@/lib/format";
import { lettersOf } from "@/lib/letters";
import { average } from "@/lib/polls";
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
  const av = average(p.id, mainPolls);
  if (!av) return p.status ?? "No poll figures";
  if (av.k === 0) return `Below the threshold in all ${av.n} polls that reported it`;
  const avg = fmt(Math.round((av.nearThreshold ? av.avg : (averagePoll.results[p.id]?.seats ?? av.avg)) * 10) / 10);
  return av.nearThreshold ? `Near the threshold: passes in ${av.k} of ${av.n} polls, ${avg} seats where it passes` : `${avg} seats in the average scaled to 120, passing in ${av.k} of ${av.n} polls`;
}

type Props = {
  party: Party;
  headingId?: string;
};

/**
 * A short preview of a list for the Party Map panel and the Coalition Builder drawer: who it is,
 * its seats, its coalition pledges, and a prominent way into the full profile page, which carries
 * everything else (stances, every poll, the names on the list, bios, sources).
 */
export default function ProfileDetail({ party: p, headingId }: Props) {
  const color = partyColor(p.id);
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
        <dt>Polls</dt>
        <dd>{seatsLine(p)}</dd>
      </dl>
      {p.who.length > 0 && (
        <div className="sec">
          <p className="lbl">Who they are</p>
          <Items items={p.who.slice(0, 2)} />
        </div>
      )}
      {p.pledges && (
        <div className="sec">
          <p className="lbl">Coalition pledges</p>
          <Items items={p.pledges} />
        </div>
      )}
      <p className="src">
        The <Link href={`/parties/${p.id}`}>full profile</Link> has where {p.name} stands on each issue, its seats in every poll, the names on its list,
        bios and sources.
      </p>
    </div>
  );
}
