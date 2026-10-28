import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { locale, type Lang } from "@/lib/i18n";
import { LIVE_COUNT } from "@/lib/i18n/live-count";
import { parties } from "@/lib/data";
import { partyColor } from "@/lib/party-colors";
import { results, type Count } from "@/lib/results";
import { resultsConfig as cfg } from "@/lib/results-live";
import { expectedFinalValid } from "@/lib/live-forecast/count-estimate";
import { listName, T } from "@/components/results/names";
import { edHref } from "@/components/results/rich";
import ResultsRefresh from "@/components/ResultsRefresh";
import "@/components/live-count.css";

const ET = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", timeZoneName: "short" });

/**
 * The raw count on the home page, list by list, as the Central Elections Committee publishes it
 * (Daniel, 2026-10-28). The page re-renders every minute; the refresher re-fetches it while the tab is visible.
 */
export default function LiveCount({ count, sourceUpdatedAt, fetchedAt, lang }: { count: Count; sourceUpdatedAt: string | null; fetchedAt: string; lang: Lang }) {
  if (!count.valid) return null;
  const t = LIVE_COUNT[lang], loc = locale(lang);
  const num = (n: number) => n.toLocaleString(loc);
  const pctOf = (x: number, d = 1) => `${(x * 100).toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d })}%`;
  const { lists } = results(count, cfg);
  // Lists with a trace of the vote (a withdrawn list keeps a stray ballot or two) fold into "Other lists".
  const shown = (l: { partyId: string | null; pct: number }) => !!l.partyId && l.pct >= 0.001;
  const tracked = lists.filter(shown).sort((a, b) => b.votes - a.votes);
  const otherVotes = lists.filter((l) => !shown(l)).reduce((n, l) => n + l.votes, 0);
  const expected = Math.max(expectedFinalValid(), count.valid);
  const counted = count.valid / expected;
  const scale = Math.max(0.3, Math.ceil(((tracked[0]?.pct ?? 0) + 0.02) * 20) / 20);
  const at = new Date(sourceUpdatedAt ?? fetchedAt);
  const israel = new Intl.DateTimeFormat(loc, { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(at);
  const threshold = cfg.threshold;
  const row = (key: string, name: ReactNode, color: string, votes: number, below: boolean, dim = below) => {
    const pct = votes / count.valid;
    return (
      <li key={key} className={dim ? "lc-below" : undefined}>
        <span className="lc-name"><span className="sw" style={{ background: color }} aria-hidden="true" />{name}</span>
        <span className="lc-bar" aria-hidden="true"><i style={{ inlineSize: `${(pct / scale) * 100}%`, background: color }} /></span>
        <span className="lc-pct">{pctOf(pct, 2)}</span>
        <span className="lc-votes">{num(votes)}</span>
        {below && <span className="sr-only">, {t.below}</span>}
      </li>
    );
  };
  return (
    <section className="live-count" aria-labelledby="lc-h" style={{ "--lc-th": `${(threshold / scale) * 100}%` } as CSSProperties}>
      <header className="lc-head">
        <h2 id="lc-h"><span className="lc-live">{t.live}</span>{t.heading}</h2>
        <p className="lc-total"><b>{num(count.valid)}</b> {t.votesCounted}<span className="lc-of">{t.ofExpected(num(expected), pctOf(counted, 0))}</span></p>
        <div className="lc-progress" role="img" aria-label={t.aria(pctOf(counted, 0))}><i style={{ inlineSize: `${Math.min(1, counted) * 100}%` }} /></div>
        <p className="lc-when"><time dateTime={at.toISOString()}>{t.updated(israel, ET.format(at))}</time></p>
      </header>
      <ol className="lc-lists">
        <li className="lc-cols" aria-hidden="true"><span>{t.th.list}</span><span className="lc-th-label">{t.threshold}</span><span>%</span><span>{t.th.votes}</span></li>
        {tracked.map((l) => {
          const p = parties.find((x) => x.id === l.partyId)!;
          return row(l.letters, <T v={listName(p, lang)} lang={lang} />, partyColor(p.id), l.votes, l.pct < threshold);
        })}
        {otherVotes > 0 && row("other", t.other, "var(--line-2)", otherVotes, false, true)}
      </ol>
      <p className="lc-note">{t.note} <Link href={edHref("/results", lang)}>{t.full}</Link></p>
      <ResultsRefresh pollsClose={cfg.pollsClose} button={false} />
    </section>
  );
}
