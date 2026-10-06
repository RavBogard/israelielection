import { readFileSync } from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import ballotJson from "@/data/ballot-directory.json";
import briefingsJson from "@/data/briefings/_index.json";
import comparisonJson from "@/data/comparison-questions.json";
import correctionsJson from "@/data/corrections.json";
import formationJson from "@/data/formation.json";
import glossaryJson from "@/data/glossary.json";
import historyJson from "@/data/party-history.json";
import journeysJson from "@/data/journeys.json";
import partiesJson from "@/data/parties.json";
import pollsJson from "@/data/polls.json";
import resultsJson from "@/data/results.json";
import timelineJson from "@/data/timeline.json";
import { COMMUNITIES, GUIDES, ISSUES } from "@/lib/articles";
import {canonicalNavPath,canonicalNavPaths} from "@/lib/navigation";
import { NAV } from "@/lib/site";
import { HE_PUBLIC, hePath } from "@/lib/i18n";

const BASE = "https://www.israelielection.org";

/** Pages with no dated data source take the build time. */
const BUILT = new Date();

const latest = (...dates: (string | undefined)[]) => dates.filter((d): d is string => !!d).sort().at(-1);
/** The "checked" date in an MDX page's meta block. */
const checked = (file: string) => {
  try { return /\bchecked"?:\s*"(\d{4}-\d{2}-\d{2})"/.exec(readFileSync(path.join(process.cwd(), "content", file), "utf8"))?.[1]; } catch { return undefined; }
};
const briefingDates = (briefingsJson as { date: string }[]).map((b) => b.date).sort();
const issues = Object.fromEntries(ISSUES.map((s) => [`/issues/${s}`, checked(`issues/${s}.mdx`)]));
const communities = Object.fromEntries(COMMUNITIES.map((s) => [`/communities/${s}`, checked(`communities/${s}.mdx`)]));
const guides = Object.fromEntries(GUIDES.map((s) => [`/how-it-works/${s}`, checked(`guides/${s}.mdx`)]));
const polls = pollsJson.updated;
const profiles = latest(partiesJson.updated, polls);

/** Each page's date from the data it shows: the polls, the newest briefing, an MDX page's checked date, a data file's checked or updated date. */
const DATED: Record<string, string | undefined> = {
  "/": polls, "/polls": polls, "/parties": profiles, "/coalition-builder": polls,
  "/news": briefingDates.at(-1),
  "/compare": latest(comparisonJson.updated, partiesJson.updated),
  "/ballot": ballotJson.checked, "/party-history": historyJson.checked, "/timeline": timelineJson.checked, "/glossary": glossaryJson.checked,
  "/start": journeysJson.checked, "/results": resultsJson.updated, "/government": formationJson.checked,
  "/corrections": latest(...(correctionsJson as { entries: { date: string }[] }).entries.map((e) => e.date)),
  "/about": checked("about.mdx"), "/american-lens": checked("american-lens.mdx"),
  "/issues": latest(...Object.values(issues)), "/communities": latest(...Object.values(communities)), "/how-it-works": latest(...Object.values(guides)),
  ...issues, ...communities, ...guides,
  ...Object.fromEntries(briefingDates.map((d) => [`/news/${d}`, d])),
  ...Object.fromEntries(partiesJson.parties.map((p) => [`/parties/${p.id}`, profiles])),
};

function lastModified(path: string): Date {
  const d = DATED[path];
  return d ? new Date(`${d}T12:00:00Z`) : BUILT;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const statics = [
    "/",
    ...NAV.map((n) => canonicalNavPath(n.href)),
    "/polls",
    "/parties",
    "/news",
    "/results",
    "/timeline",
    "/glossary",
    "/vote-map",
    "/american-lens",
    "/how-it-works",
    "/issues",
    "/communities",
    "/coalition-builder",
  ];
  const dynamic = [
    ...briefingDates.map(date=>`/news/${date}`),
    ...partiesJson.parties.map((p) => `/parties/${p.id}`),
    ...ISSUES.map((s) => `/issues/${s}`),
    ...COMMUNITIES.map((s) => `/communities/${s}`),
    ...GUIDES.map((s) => `/how-it-works/${s}`),
  ];
  const paths = canonicalNavPaths([...statics, ...dynamic]);
  const url = (p: string) => (p === "/" ? BASE : `${BASE}${p}`);
  // Pages with a Hebrew edition (HE_PATHS in lib/i18n) list both editions, each carrying the same hreflang set.
  const languages = (en: string, he: string) => ({ languages: { en: url(en), he: url(he), "x-default": url(en) } });
  return paths.flatMap((path) => {
    const he = HE_PUBLIC ? hePath(path) : null;
    const entry = { url: url(path), lastModified: lastModified(path) };
    if (!he) return [entry];
    const alternates = languages(path, he);
    return [{ ...entry, alternates }, { url: url(he), lastModified: lastModified(path), alternates }];
  });
}
