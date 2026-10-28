import Link from "next/link";
import type { ReactNode } from "react";
import type { ElectionLifecycleSnapshot } from "@/lib/election-lifecycle/types";
import { chamberLayout, seatGovernment, shadeOf } from "@/lib/chamber";
import { CHAMBER } from "@/lib/i18n/chamber";
import { STANDING } from "@/lib/i18n/standing-home";
import { editionPath, locale, type Lang } from "@/lib/i18n";
import { listName } from "@/components/results/names";
import { blocOfList } from "@/lib/outgoing-seats";
import { longDate } from "@/lib/format";
import { currentElection } from "@/lib/political-record/elections";
import { KNESSET_LAW_URL, nextElectionDue, type SwornGovernment } from "@/lib/standing-home";
import "./standing-home.css";

const MAJORITY = 61, TOTAL = 120;
const LAYOUT = chamberLayout(TOTAL);
/** A list's step on its bloc's ramp, as in the chamber hero (components/ChamberHero.tsx). */
const tone = (bloc: string, shade: number) => (shade >= 100 ? `var(--b-${bloc})` : `color-mix(in srgb, var(--b-${bloc}) ${shade}%, var(--sh-mix))`);
/** The swearing-in's calendar day in Israel. */
const israelDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

/**
 * The home page once a government is sworn in (Daniel, 2026-10-28): a standing reference for the next Israeli
 * election. The sworn-in government leads in the 120-seat hall, coalition lists in full colour on the right and the
 * opposition in outline on the left; beside it the prime minister, the coalition, the swearing-in and the date the
 * next election falls due. Every figure comes from the lifecycle record /government reads (lib/standing-home.ts).
 */
export default function StandingHome({ government, snapshot, lang, news }: { government: SwornGovernment; snapshot: ElectionLifecycleSnapshot; lang: Lang; news?: ReactNode }) {
  const t = STANDING[lang], c = CHAMBER[lang], loc = locale(lang), n = (x: number) => x.toLocaleString(loc);
  const href = (path: string) => editionPath(path, lang) ?? path;
  const named = new Map(snapshot.seatContext.parties.map((p) => [p.id, p]));
  const lists = Object.entries(government.seats).map(([id, seats]) => ({ id, seats, bloc: named.get(id)?.bloc ?? blocOfList[id] ?? "other" }));
  const inGov = new Set(government.coalition);
  const placed = seatGovernment(LAYOUT, lists, government.coalition);
  const shadeOfList = (id: string) => { const l = lists.find((x) => x.id === id)!; const mine = lists.filter((x) => x.bloc === l.bloc).sort((a, b) => b.seats - a.seats || a.id.localeCompare(b.id)); return shadeOf(mine.findIndex((x) => x.id === id), mine.length); };
  const partyLabel = (id: string) => listName({ id, name: named.get(id)?.label ?? id }, lang).text;
  const coalition = lists.filter((l) => inGov.has(l.id)).sort((a, b) => b.seats - a.seats || a.id.localeCompare(b.id));
  const opposition = lists.filter((l) => !inGov.has(l.id)).reduce((a, l) => a + l.seats, 0);
  const summary = coalition.map((l) => `${partyLabel(l.id)} ${n(l.seats)}`).join(", ");
  const due = nextElectionDue(currentElection().electionDay);
  const source = government.sources[0];
  const law = lang === "he" ? KNESSET_LAW_URL.he : KNESSET_LAW_URL.en;
  const links: [string, string][] = [
    [`/elections/${currentElection().id}`, t.edition],
    ["/results", t.results],
    ["/parliament", t.parliament],
    ["/government", t.government],
    ["/parties", t.parties],
    ["/how-it-works", t.how],
    ["/timeline", t.timeline],
    ["/glossary", t.glossary],
    ["/vote-map", t.voteMap],
  ];
  return (
    <>
      <section className="standing-home" aria-labelledby="standing-h" data-testid="standing-home">
        <figure className="sh-chart" data-testid="standing-chamber">
          <svg viewBox="0 -30 620 370" role="img" aria-label={t.aria(n(government.coalitionSeats), n(TOTAL), summary)}>
            {placed.map((s, i) => (
              <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r.toFixed(1)} data-list={s.party} data-side={s.coalition ? "coalition" : "opposition"}
                className={s.coalition ? "sh-seat sh-gov" : "sh-seat sh-opp"} style={s.coalition ? { fill: tone(s.bloc, s.shade) } : { stroke: tone(s.bloc, s.shade) }}>
                <title>{partyLabel(s.party)}</title>
              </circle>
            ))}
            <line x1="310" x2="310" y1="-8" y2="220" className="sh-mid" />
            <text x="310" y="-14" textAnchor="middle" className="sh-mid-label">{c.centre(n(MAJORITY))}</text>
            <text x="310" y="284" textAnchor="middle" className="sh-total">{n(government.coalitionSeats)}</text>
            <text x="310" y="308" textAnchor="middle" className="sh-total-sub">{t.centreSub(n(TOTAL))}</text>
          </svg>
          <figcaption>{t.note}</figcaption>
        </figure>
        <div className="sh-side">
          <h1 id="standing-h">{t.heading}</h1>
          <dl className="sh-facts" data-testid="standing-facts">
            <dt>{t.pm}</dt>
            <dd className="sh-pm"><bdi>{government.person}</bdi></dd>
            <dt>{t.coalition}</dt>
            <dd>{t.seatsOf(n(government.coalitionSeats), n(TOTAL))}</dd>
            <dt>{t.sworn}</dt>
            <dd><time dateTime={government.swornAt}>{longDate(israelDay(government.swornAt), lang)}</time>{source && <> <a href={source.url}>{t.source}</a></>}</dd>
            <dt>{t.opposition}</dt>
            <dd>{t.seats(n(opposition))}</dd>
          </dl>
          <ul className="sh-lists" aria-label={t.listsLabel} data-testid="standing-coalition">
            {coalition.map((l) => (
              <li key={l.id} data-list={l.id}>
                <span className="sh-dot" style={{ background: tone(l.bloc, shadeOfList(l.id)) }} aria-hidden="true" />
                {named.get(l.id)?.profiled !== false ? <a href={href(`/parties/${l.id}`)}>{partyLabel(l.id)}</a> : <span>{partyLabel(l.id)}</span>}
                <b>{n(l.seats)}</b>
              </li>
            ))}
          </ul>
          <section className="sh-next" aria-labelledby="standing-next-h" data-testid="standing-next">
            <h2 id="standing-next-h">{t.nextH}</h2>
            <p className="sh-due"><time dateTime={due}>{t.nextDue(longDate(due, lang))}</time></p>
            <p className="sh-note">{t.nextNote} <a href={law} hrefLang={lang === "he" || lang === "en" ? undefined : "en"}>{t.lawLink}</a></p>
          </section>
        </div>
      </section>
      {news && <div className="sh-news">{news}</div>}
      <nav className="sh-links" aria-labelledby="standing-links-h" data-testid="standing-links">
        <h2 id="standing-links-h">{t.linksH}</h2>
        <ul>{links.map(([path, label]) => <li key={path}><Link href={href(path)}>{label}</Link></li>)}</ul>
      </nav>
    </>
  );
}
