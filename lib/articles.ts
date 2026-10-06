import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * The reference layer: issue pages, community pages and the American lens page.
 * Copy is MDX in content/; every chart lives in data/charts/<slug>.json and every
 * party-positions table in data/positions/<issue>.json, so numbers and sources are
 * data with a diff, and lib/articles.test.ts can check them.
 */

export type Kind = "issue" | "community" | "guide" | "essay";

export type ArticleMeta = {
  title: string;
  /** One sentence under the title; also the page's meta description. */
  dek: string;
  /** Date the page's facts were last checked, YYYY-MM-DD. */
  checked: string;
};

export const ISSUES = [
  "haredi-draft",
  "courts",
  "war-hostages",
  "west-bank",
  "religion-state",
  "economy",
  "palestinian-state",
] as const;

export const COMMUNITIES = [
  "secular",
  "masorti",
  "religious-zionists",
  "haredim",
  "russian-speakers",
  "ethiopian-israelis",
  "palestinian-citizens",
  "druze",
  "settlers",
] as const;

/** How it works: the mechanics of the system, at /how-it-works/<slug>. */
export const GUIDES = ["seats", "forming-a-government", "voting", "who-votes"] as const;

export type IssueSlug = (typeof ISSUES)[number];
export type CommunitySlug = (typeof COMMUNITIES)[number];
export type GuideSlug = (typeof GUIDES)[number];

/** One bar (kind "bars") or one row (kind "table"). */
export type ChartRow = {
  label: string;
  /** Bars: the number drawn. */
  value?: number;
  /** Bars: how the number is printed, when it isn't just value + unit (e.g. "about 13%"). */
  display?: string;
  /** Table: one cell per column after the first. */
  cells?: string[];
  /** Per-row source, when rows come from different sources (overrides the chart's). */
  source?: string;
  url?: string;
  date?: string;
};

export type Chart = {
  title: string;
  kind: "bars" | "table";
  /** Bars: "%" or "seats", printed after each value. */
  unit?: string;
  /** Bars: the scale's maximum (default 100 for "%", else the largest value). */
  max?: number;
  /** Table: column headings, the first one heading the row labels. */
  columns?: string[];
  rows: ChartRow[];
  /** Survey question or what is counted, in the source's words where possible. */
  question?: string;
  source: string;
  url: string;
  /** Fieldwork or publication date, as the source gives it ("May 2025", "2022-11-01"). */
  date: string;
  sample?: string;
  note?: string;
};

export type Position = {
  /** A party id from data/parties.json. */
  party: string;
  /** What the party says, in its own words where possible; no characterization. Absent when nothing was found. */
  text?: string;
  source?: string;
  url?: string;
  date?: string;
  /** One of the file's `stances` ids (see lib/positions.test.ts). */
  stance?: string;
  /** "declined": refused to answer; "none": nothing published was found by `checked`. */
  status?: "declined" | "none";
  /** "record": the stance comes from a statement, bill or vote, not the 2026 questionnaire. */
  basis?: "record" | "unstated";
  checked?: string;
};

export type Positions = { issue: string; title: string; question?: string; stances?: { id: string; label: string }[]; note?: string; rows: Position[] };

const DATA = path.join(process.cwd(), "data");

function readDir<T>(dir: string): Record<string, T> {
  const out: Record<string, T> = {};
  for (const f of readdirSync(path.join(DATA, dir))) {
    if (f.endsWith(".json")) out[f.slice(0, -5)] = JSON.parse(readFileSync(path.join(DATA, dir, f), "utf8"));
  }
  return out;
}

/** Every chart, keyed "<slug>.<id>" (data/charts/<slug>.json holds { "<id>": Chart }). */
export function allCharts(): Record<string, Chart> {
  const out: Record<string, Chart> = {};
  for (const [slug, charts] of Object.entries(readDir<Record<string, Chart>>("charts"))) {
    for (const [id, c] of Object.entries(charts)) out[`${slug}.${id}`] = c;
  }
  return out;
}

export function allPositions(): Record<string, Positions> {
  return readDir<Positions>("positions");
}

export const hrefFor = (kind: Kind, slug: string) =>
  kind === "issue" ? `/issues/${slug}` : kind === "community" ? `/communities/${slug}` : kind === "guide" ? `/how-it-works/${slug}` : `/${slug}`;
