import { readFileSync } from "node:fs";
import path from "node:path";
import timeline from "@/data/timeline.json";
import { currentElection, electionByRef } from "./political-record/elections";

/**
 * Read-only summary editions for the elections before the current one (Knesset 21 to 25), built only from files the site
 * already ships: the committee's per-election files in public/vote-map and the timeline rows. Nothing is typed in by hand.
 */
const MAP_IDS = { "il-knesset-21": "2019a", "il-knesset-22": "2019b", "il-knesset-23": "2020", "il-knesset-24": "2021", "il-knesset-25": "2022" } as const;
export const ARCHIVE_EDITION_IDS = Object.keys(MAP_IDS) as (keyof typeof MAP_IDS)[];

type TimelineRow = (typeof timeline.elections)[number] & { outcomeSource?: { name: string; date: string; url: string } };
type MapFile = {
  date: string;
  knesset: number;
  source: { results: string; csv: string; fetched: string };
  national: { eligible: number; voted: number; valid: number };
  lists: { name: string; votes: number; seats: number }[];
};
export type ArchiveEdition = {
  id: string;
  termNumber: number;
  voteMapId: string;
  electionDay: string;
  source: MapFile["source"];
  national: MapFile["national"];
  turnoutPct: number;
  lists: { name: string; votes: number; sharePct: number; seats: number }[];
  otherVotes: number;
  government: { text: string; source: { name: string; date: string; url: string } } | null;
  timelineSource: { name: string; url: string } | null;
};

/** A public reference ("il-knesset-25", "25", "2022", "2019a") to the canonical archive edition id, or null. */
export function archiveEditionId(ref: string): string | null {
  if (Object.hasOwn(MAP_IDS, ref)) return ref;
  const byTerm = ARCHIVE_EDITION_IDS.find((id) => id === `il-knesset-${ref}`);
  if (byTerm) return byTerm;
  return ARCHIVE_EDITION_IDS.find((id) => MAP_IDS[id] === ref) ?? null;
}

/** The canonical edition id for any public alias, current or archived ("2026", "26", "il-knesset-26", "2022"), or null. */
export function canonicalEditionId(ref: string): string | null {
  return electionByRef(ref)?.id ?? archiveEditionId(ref);
}

export function archiveEdition(ref: string): ArchiveEdition | null {
  const id = archiveEditionId(ref);
  if (!id || id === currentElection().id) return null;
  const voteMapId = MAP_IDS[id as keyof typeof MAP_IDS];
  let file: MapFile;
  try {
    file = JSON.parse(readFileSync(path.join(process.cwd(), "public", "vote-map", `${voteMapId}.json`), "utf8"));
  } catch {
    return null;
  }
  const row = (timeline.elections as TimelineRow[]).find((e) => e.knesset === file.knesset);
  const listed = file.lists.reduce((n, l) => n + l.votes, 0);
  return {
    id,
    termNumber: file.knesset,
    voteMapId,
    electionDay: file.date,
    source: file.source,
    national: file.national,
    turnoutPct: file.national.eligible ? (file.national.voted / file.national.eligible) * 100 : 0,
    lists: file.lists.map((l) => ({ name: l.name, votes: l.votes, sharePct: file.national.valid ? (l.votes / file.national.valid) * 100 : 0, seats: l.seats })),
    otherVotes: Math.max(0, file.national.valid - listed),
    government: row?.outcome ? { text: row.outcome, source: row.outcomeSource ?? { ...row.source, date: row.source.date ?? "" } } : null,
    timelineSource: row ? { name: row.source.name, url: row.source.url } : null,
  };
}
