import { outgoingBlocSeats, outgoingSeatsData } from "@/lib/outgoing-seats";
import { FACTION_HE, NOW_SEATS } from "@/lib/i18n/now-seats";
import type { Lang } from "@/lib/i18n";
import "./now-seats.css";

/** "Likud 32 + New Hope 4" for a list built from several outgoing factions; null for a single faction. */
export function nowComponents(id: string, lang: Lang): string | null {
  const parts = (outgoingSeatsData.lists[id]?.components ?? []).filter((c) => c.seats > 0);
  if (parts.length < 2) return null;
  return parts.map((c) => `${lang === "he" ? (FACTION_HE[c.faction] ?? c.faction) : c.faction} ${c.seats}`).join(" + ");
}

/**
 * The outgoing Knesset's seats for a list, as a small hollow chip beside (never inside) the projected figure:
 * "last Knesset 36", or "new" for a list with no sitting MKs. `bare` drops the word where a column heading already says it. Renders nothing for an id with no outgoing record.
 */
export default function NowSeats({ id, lang, bare = false }: { id: string; lang: Lang; bare?: boolean }) {
  const list = outgoingSeatsData.lists[id];
  if (!list || list.seats === null) return null;
  const t = NOW_SEATS[lang];
  const n = list.seats;
  const parts = nowComponents(id, lang);
  const sr = (n ? t.sr(n) : t.srFresh) + (parts && n ? ` (${parts})` : "");
  return (
    <span className={`now-chip${n ? "" : " now-new"}`} data-testid="now-seats" data-now={n ? String(n) : "new"} title={sr}>
      <span aria-hidden="true">{n ? (bare ? String(n) : t.chip(n)) : t.fresh}</span>
      <span className="now-sr">{sr}</span>
    </span>
  );
}

/** The one key line under the first graphic in a section that shows the chip. */
export function NowSeatsKey({ lang, className }: { lang: Lang; className?: string }) {
  return (
    <p className={`now-key${className ? ` ${className}` : ""}`} data-testid="now-seats-key">
      {NOW_SEATS[lang].key}
    </p>
  );
}

/** The same chip for a bloc: the seats its lists held in the outgoing Knesset ("last Knesset 68"). Nothing for "other". */
export function NowBlocSeats({ id, lang, bare = false }: { id: string; lang: Lang; bare?: boolean }) {
  const n = outgoingBlocSeats[id];
  if (n === undefined) return null;
  const t = NOW_SEATS[lang];
  return (
    <span className="now-chip" data-testid="now-bloc-seats" data-now={String(n)} title={t.sr(n)}>
      <span aria-hidden="true">{bare ? String(n) : t.chip(n)}</span>
      <span className="now-sr">{t.sr(n)}</span>
    </span>
  );
}
