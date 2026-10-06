/**
 * The party profile's figures, computed once per page from the site's data: the at-a-glance
 * numbers, the seat series across every poll since dissolution, the 2022 result and the
 * localities where the list ran strongest, the voter base where IDI published one, and the
 * party's standing on the seven comparison issues. Nothing here is estimated: every figure is
 * read from data/*.json or the Central Elections Committee's locality file.
 */
import voterBaseJson from "@/data/voter-base.json";
import election from "@/public/vote-map/2022.json";
import places from "@/public/vote-map/places.json";
import { standingOf, type Stance } from "@/lib/cohesion";
import { AXES, type AxisKey } from "@/lib/compare";
import { allPolls, averagePoll, blocLabel, mainPolls, parties, pollsData, variantPolls } from "@/lib/data";
import { lettersOf } from "@/lib/letters";
import { average, blocTotals, isExit } from "@/lib/polls";
import { ISSUES } from "@/lib/positions";
import type { Party } from "@/lib/types";
import type { Places, VoteMapElection } from "@/lib/votemap";
import { project } from "@/lib/votemap";

export type Reading = {
  id: string;
  date: string;
  pollster: string;
  /** Seats, 0 when below the threshold, null when the poll did not report the list separately. */
  seats: number | null;
  below: boolean;
  /** One of the pollsters the site's alternative average leaves out. */
  variant: boolean;
  dateUncertain: boolean;
};

export type Glance = {
  avg: number | null;
  k: number;
  n: number;
  nearThreshold: boolean;
  low: number | null;
  high: number | null;
  variantAvg: number | null;
  variantLabel: string;
  blocSeats: number;
  blocRank: number;
  blocSize: number;
  firstDate: string;
  lastDate: string;
};

export type Result2022 = { seats: number; votes: number; share: number; listName: string; sameName: boolean };

export type Locality = { code: number; name: string; x: number; y: number; valid: number; share: number; labelled: boolean };

export type Strongholds = {
  national: number;
  dots: Locality[];
  /** The rows of the table beside the map: the five strongest, the national share, the three biggest cities, the weakest big city. */
  table: { name: string; share: number; kind: "top" | "national" | "city" | "low" }[];
};

export type VoterBase = {
  listName: string;
  source: string;
  groups: { label: string; pct: number }[];
  won: { label: string; pct: number }[];
};

export type Tile = {
  key: AxisKey;
  label: string;
  question: string | null;
  kind: "stance" | "declined" | "none";
  stance: string | null;
  /** 0 for the first option on the issue's scale, 1 for the last; null when the options are not a scale. */
  position: number | null;
  text: string | null;
  source: string | null;
  url: string | null;
  date: string | null;
  basis: "record" | null;
  sameStance: { id: string; name: string }[];
};

/** Reading order and short names for the tiles; the economy's options coexist, so it is not drawn as a scale. */
const TILE_ORDER: { key: AxisKey; label: string; scale: boolean }[] = [
  { key: "draft", label: "Haredi draft", scale: true },
  { key: "courts", label: "Courts", scale: true },
  { key: "war", label: "October 7 inquiry", scale: true },
  { key: "wb", label: "West Bank", scale: true },
  { key: "pstate", label: "Palestinian state", scale: true },
  { key: "relig", label: "Religion and state", scale: true },
  { key: "econ", label: "Economy", scale: false },
];

const e = election as unknown as VoteMapElection;
const pl = places as unknown as Places;
const vb = voterBaseJson as { parties: Record<string, VoterBase> };

export function readings(party: Party): Reading[] {
  const variant = new Set(pollsData.config.withoutVariant.pollsters);
  return [...allPolls]
    .filter((p) => !isExit(p))
    .sort((a, b) => a.published.localeCompare(b.published) || a.id.localeCompare(b.id))
    .map((p) => {
      const r = p.results[party.id];
      return {
        id: p.id,
        date: p.published,
        pollster: p.pollster,
        seats: r ? (r.belowThreshold ? 0 : r.seats) : null,
        below: !!r?.belowThreshold,
        variant: variant.has(p.pollster),
        dateUncertain: !!r?.dateUncertain,
      };
    });
}

export function glance(party: Party, series: Reading[]): Glance {
  const av = average(party.id, mainPolls);
  const wv = average(party.id, variantPolls);
  const passing = mainPolls.map((p) => p.results[party.id]).filter((r) => r && !r.belowThreshold && r.seats > 0).map((r) => r!.seats);
  const totals = blocTotals(averagePoll, parties);
  const mates = parties.filter((p) => p.bloc === party.bloc).map((p) => ({ id: p.id, seats: averagePoll.results[p.id]?.seats ?? 0 })).sort((a, b) => b.seats - a.seats);
  const reported = series.filter((r) => r.seats !== null);
  return {
    avg: av && av.k > 0 ? av.avg : null,
    k: av?.k ?? 0,
    n: av?.n ?? 0,
    nearThreshold: !!av?.nearThreshold,
    low: passing.length ? Math.min(...passing) : null,
    high: passing.length ? Math.max(...passing) : null,
    variantAvg: wv && wv.k > 0 && !wv.nearThreshold ? wv.avg : null,
    variantLabel: pollsData.config.withoutVariant.label,
    blocSeats: totals[party.bloc],
    blocRank: Math.max(1, mates.findIndex((m) => m.id === party.id) + 1),
    blocSize: mates.filter((m) => m.seats > 0).length,
    firstDate: reported[0]?.date ?? series[0]?.date ?? pollsData.config.dissolved,
    lastDate: reported.at(-1)?.date ?? series.at(-1)?.date ?? pollsData.updated,
  };
}

export function result2022(party: Party): Result2022 | null {
  const letters = lettersOf[party.id];
  const list = letters ? e.lists.find((l) => l.letters === letters) : undefined;
  if (!list) return null;
  return { seats: list.seats, votes: list.votes, share: list.votes / e.national.valid, listName: list.name, sameName: list.name === party.name };
}

const BIG_CITIES = ["Tel Aviv-Yafo", "Jerusalem", "Haifa"];

export function strongholds(party: Party): Strongholds | null {
  const letters = lettersOf[party.id];
  const li = letters ? e.lists.findIndex((l) => l.letters === letters) : -1;
  if (li < 0) return null;
  const col = 4 + li;
  const dots: Locality[] = [];
  for (const row of e.rows) {
    const p = pl[String(row[0])];
    if (!p || !p[1] || !p[2] || !row[3]) continue;
    const [x, y] = project([p[2], p[1]]);
    dots.push({ code: row[0], name: p[0], x, y, valid: row[3], share: row[col] / row[3], labelled: false });
  }
  const national = e.lists[li].votes / e.national.valid;
  const top = [...dots].filter((d) => d.valid >= 15000).sort((a, b) => b.share - a.share).slice(0, 5);
  const cities = BIG_CITIES.map((n) => dots.find((d) => d.name === n)).filter((d): d is Locality => !!d);
  const low = [...dots].filter((d) => d.valid >= 50000 && !cities.includes(d) && !top.includes(d)).sort((a, b) => a.share - b.share).slice(0, 1);
  for (const d of [...top, ...cities, ...low]) d.labelled = true;
  const table: Strongholds["table"] = [
    ...top.map((d) => ({ name: d.name, share: d.share, kind: "top" as const })),
    { name: "Nationally", share: national, kind: "national" as const },
    ...cities.map((d) => ({ name: d.name, share: d.share, kind: "city" as const })),
    ...low.map((d) => ({ name: d.name, share: d.share, kind: "low" as const })),
  ];
  return { national, dots, table };
}

export function voterBase(party: Party): VoterBase | null {
  return vb.parties[party.id] ?? null;
}

export function tiles(party: Party): Tile[] {
  return TILE_ORDER.map(({ key, label, scale }) => {
    const file = ISSUES[key];
    const row = file.rows.find((r) => r.party === party.id);
    const stances: Stance[] = file.stances ?? [];
    const st = standingOf(row, stances);
    const idx = st.kind === "stance" ? stances.findIndex((s) => s.id === st.stance) : -1;
    const sameStance =
      st.kind === "stance"
        ? file.rows
            .filter((r) => r.party !== party.id && standingOf(r, stances).kind === "stance" && r.stance === st.stance)
            .map((r) => parties.find((p) => p.id === r.party))
            .filter((p): p is Party => !!p)
            .map((p) => ({ id: p.id, name: p.name }))
        : [];
    return {
      key,
      label,
      question: file.question ?? null,
      kind: st.kind === "stance" ? "stance" : st.kind === "declined" ? "declined" : "none",
      stance: idx >= 0 ? stances[idx].label : null,
      position: idx >= 0 && scale && stances.length > 1 ? idx / (stances.length - 1) : null,
      text: row?.text?.trim() || null,
      source: row?.source ?? null,
      url: row?.url ?? null,
      date: row?.date ?? null,
      basis: row?.basis === "record" ? "record" : null,
      sameStance,
    };
  });
}

export function axisLabel(key: AxisKey): string {
  return AXES.find((a) => a.key === key)?.label ?? key;
}

export { blocLabel };
