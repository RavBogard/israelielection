import { partyColor } from "@/lib/party-colors";
import { HISTORY_KINDS, histories, historyFamilies, type HistoryEvent, type HistoryKind } from "@/lib/party-history";

/* Most of the record falls after 2005, so the axis gives 1965–2005 a third of the width and
   2005–2026 the rest, with the change of scale marked on the axis. */
const Y0 = 1965, BREAK = 2005, Y1 = 2026.9, SPLIT = 0.3;
const x = (y: number) => (y <= BREAK ? ((y - Y0) / (BREAK - Y0)) * SPLIT : SPLIT + ((y - BREAK) / (Y1 - BREAK)) * (1 - SPLIT)) * 100;
const TICKS = [1970, 1980, 1990, 2005, 2010, 2015, 2020, 2026];
/** Ticks with a printed year under the axis; 2005, where the scale changes, is printed beside the break. */
const LABELLED = TICKS.filter((t) => t !== BREAK);

/** The four shapes the marks take: what an event does to the list's line. */
type Mark = "start" | "join" | "leave" | "ballot" | "slip";
const MARK: Record<HistoryKind, Mark> = { party: "start", alliance: "join", merger: "join", partial: "join", split: "leave", leader: "leave", rename: "ballot", list: "slip" };
const MARK_LABEL: Record<Mark, string> = { start: "Party established", join: "Alliance or merger", leave: "Split or a leader's move", ballot: "Name change", slip: "2026 ballot list" };

/** A mark as a small drawing, so its shape holds at any size. */
function M({ m }: { m: Mark }) {
  return (
    <svg className={`ph-m ${m}`} viewBox="-8 -8 16 16" width="16" height="16" aria-hidden="true">
      {m === "start" && <circle r="6" />}
      {m === "join" && <path d="M0 -6.5 L6.5 0 L0 6.5 L-6.5 0 Z" />}
      {m === "leave" && <path d="M0 -6.5 L6.5 5.5 L-6.5 5.5 Z" />}
      {m === "ballot" && <rect x="-2" y="-7.5" width="4" height="15" />}
      {m === "slip" && <><rect x="-5" y="-6.5" width="10" height="13" /><path d="M-2.5 -1.5 H2.5 M-2.5 2 H2.5" /></>}
    </svg>
  );
}

const years = (d: string): [number, number] => {
  const ys = [...d.matchAll(/(19|20)\d{2}/g)].map((m) => Number(m[0]));
  return [ys[0], ys.at(-1)!];
};

/**
 * The family tree as lanes: one line per 2026 list in its own colour, from its first recorded
 * event to the election, with a mark for each event: established, joining others on a ballot or
 * merging, a split or a leader's move, and a renaming or the 2026 filing. Lists are grouped by
 * political branch; each name links to its full history below.
 */
export default function PartyLanes() {
  const label = (e: HistoryEvent) => `${e.date}, ${HISTORY_KINDS[e.kind]}: ${e.output}. ${e.text}`;
  return (
    <figure className="ph-lanes">
      <figcaption className="ph-h">Every 2026 list&apos;s organizational history, 1965 to 2026</figcaption>
      <p className="fig-key ph-key" aria-hidden="true">
        {(Object.keys(MARK_LABEL) as Mark[]).map((m) => (
          <span key={m}><M m={m} />{MARK_LABEL[m]}</span>
        ))}
      </p>
      <div className="ph-grid">
        <div className="ph-axis" aria-hidden="true">
          <span />
          <span className="ph-track">
            {LABELLED.map((t) => <i key={t} style={{ left: `${x(t)}%` }}>{t}</i>)}
            <b className="ph-break" style={{ left: `${x(BREAK)}%` }} />
            <em className="ph-break-l" style={{ left: `${x(BREAK)}%` }}>{BREAK}</em>
          </span>
        </div>
        {historyFamilies.map((f) => (
          <section key={f} className="ph-fam" aria-label={f}>
            <p className="ph-famname">{f}</p>
            {histories.filter((h) => h.family === f).map((h) => {
              const first = Math.min(...h.events.map((e) => years(e.date)[0]));
              const c = partyColor(h.id);
              return (
                <div key={h.id} className="ph-lane">
                  <a href={`#${h.id}`} className="ph-name"><span className="sw" style={{ background: c }} aria-hidden="true" />{h.name}</a>
                  <a href={`#${h.id}`} className="ph-track" aria-label={`${h.name}: ${h.events.map(label).join(" ")} Full history below.`}>
                    {TICKS.map((t) => <i key={t} className="ph-grid-l" style={{ left: `${x(t)}%` }} aria-hidden="true" />)}
                    <span className="ph-line" style={{ left: `${x(first)}%`, right: 0, background: c }} />
                    {h.events.map((e, i) => {
                      const [a, b] = years(e.date);
                      return (
                        <span key={i} className={`ph-ev ${MARK[e.kind]}`} style={{ left: `${x(a)}%`, width: b > a ? `${x(b) - x(a)}%` : undefined, ["--c" as string]: c }} title={label(e)}>
                          <M m={MARK[e.kind]} />
                        </span>
                      );
                    })}
                  </a>
                </div>
              );
            })}
          </section>
        ))}
      </div>
      <p className="fig-src ph-src">The axis gives 1965–2005 a third of the width and 2005–2026 the rest, where most of the record falls; the double line on the axis marks the change of scale, at 2005. A bar under a mark is an event that ran over several years. Point at a mark for what happened, or tap a list&apos;s line or name for its full history, with sources, below.</p>
    </figure>
  );
}
