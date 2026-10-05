import Link from "next/link";
import { blocLabel, mainPolls, otherPolls, partiesData } from "@/lib/data";
import { fmt, mediumDate, shortDate } from "@/lib/format";
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

function Seats({ party }: { party: Party }) {
  const fill = `var(--b-${party.bloc})`;
  const av = average(party.id, mainPolls);
  if (!av) {
    return (
      <div className="sec">
        <p className="lbl">Seats</p>
        <p>{party.status ?? "No poll figures"}.</p>
      </div>
    );
  }
  const rows = [...mainPolls, ...otherPolls].map((poll) => {
    const r = poll.results[party.id];
    const when = r?.dateUncertain ? "latest" : shortDate(poll.published);
    const dated = r?.dateUncertain ? " (date not given in our register)" : `, ${mediumDate(poll.published)}`;
    const txt = !r ? "n/a" : r.belowThreshold ? (r.pct ? `below (${r.pct})` : "0") : String(r.seats);
    const tip = !r
      ? `${poll.pollster} (${mediumDate(poll.published)}) did not report ${party.name} separately`
      : r.belowThreshold
        ? `Below threshold${r.pct ? ` at ${r.pct}` : ""}, ${poll.pollster}${dated}`
        : `${r.seats} seats, ${poll.pollster}${dated}`;
    const w = r && !r.belowThreshold ? (r.seats / 35) * 100 : 0;
    return (
      <div key={poll.id} style={{ display: "contents" }}>
        <span className="d">
          {poll.pollster}, {when}
        </span>
        <span className={`bar${otherPolls.includes(poll) ? " x" : ""}`} title={tip}>
          <i style={{ width: `${w}%`, background: fill }} />
        </span>
        <span className="v" title={tip}>
          {txt}
        </span>
      </div>
    );
  });
  const notes = [`Average ${fmt(av.avg)} across ${av.n} poll${av.n > 1 ? "s" : ""} (${otherPolls.map((p) => p.pollster).join(", ")} not included).`];
  for (const poll of mainPolls) {
    const r = poll.results[party.id];
    if (!r) notes.push(`${poll.pollster} (${shortDate(poll.published)}) did not report this party separately.`);
    else if (r.belowThreshold) notes.push(`${poll.pollster} had it below the threshold.`);
  }
  for (const poll of otherPolls)
    if (poll.results[party.id]?.dateUncertain)
      notes.push(`${poll.pollster} figure is the latest in our register; its date is not given.`);
  return (
    <div className="sec">
      <p className="lbl">Seats in each poll</p>
      <div className="polls">{rows}</div>
      <p className="src">{notes.join(" ")}</p>
    </div>
  );
}

type Props = {
  party: Party;
  headingId?: string;
  /** Show a link to the party's own page. */
  linkToPage?: boolean;
};

export default function ProfileDetail({ party: p, headingId, linkToPage }: Props) {
  const color = `var(--b-${p.bloc})`;
  const leaderName = p.leader.split(" (")[0].split(",")[0];
  return (
    <div className="profile" style={{ ["--qc" as string]: color }}>
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
      <dl className="kv">
        <dt>Leader</dt>
        <dd>{p.leader}</dd>
        {p.surplusPartner && (
          <>
            <dt>Surplus-vote partner</dt>
            <dd>
              {p.surplusPartner.text}
              <Src s={p.surplusPartner.source} />
            </dd>
          </>
        )}
      </dl>
      {linkToPage && (
        <Link className="more" href={`/parties/${p.id}`}>
          Open {p.name}&apos;s own page
        </Link>
      )}
      <div className="sec">
        <p className="lbl">Who they are</p>
        <Items items={p.who} />
      </div>
      {p.thin && <p className="src">{p.thin}</p>}
      {p.voters && (
        <div className="sec">
          <p className="lbl">Who votes for them</p>
          <Items items={p.voters} />
        </div>
      )}
      {p.issues && (
        <div className="sec">
          <p className="lbl">Where they stand</p>
          <dl className="issues">
            {partiesData.issues.map(({ key, label }) => {
              const v = p.issues![key];
              return (
                <div key={key} style={{ display: "contents" }}>
                  <dt>{label}</dt>
                  {v ? (
                    <dd>
                      {v.text}
                      <Src s={v.source} />
                    </dd>
                  ) : (
                    <dd className="nf">No 2026 position found</dd>
                  )}
                </div>
              );
            })}
          </dl>
        </div>
      )}
      {p.names && (
        <div className="sec">
          <p className="lbl">Names on the list</p>
          <ul className="names">
            {p.names.map((n) => (
              <li key={n.name}>
                <span className="slot">{n.slot === "—" ? "—" : `No. ${n.slot}`}</span>
                <span>
                  <b>{n.name}</b>
                  {n.note ? `, ${n.note}` : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="src">{p.namesSource}</p>
        </div>
      )}
      {p.pledges && (
        <div className="sec">
          <p className="lbl">Coalition pledges</p>
          <Items items={p.pledges} />
        </div>
      )}
      {p.quote && (
        <div className="sec">
          <p className="lbl">In their words</p>
          <blockquote style={{ ["--qc" as string]: color }}>
            “{p.quote.text}”
            <footer>
              {p.quote.speaker}. {p.quote.source}
            </footer>
          </blockquote>
        </div>
      )}
      <Seats party={p} />
      {p.bios ? (
        <div className="sec">
          <p className="lbl">Bios</p>
          {p.bios.map((b) => (
            <p className="bio" key={b.name}>
              <b>{b.name}.</b> {b.text}
            </p>
          ))}
          <p className="src">Bio source: {partiesData.bioSource}</p>
        </div>
      ) : (
        <div className="sec">
          <p className="lbl">Leader bio</p>
          <p className="bio">Our research registers have no bio for {leaderName}.</p>
        </div>
      )}
    </div>
  );
}
