import type { MetadataRoute } from "next";
import briefingsJson from "@/data/briefings/_index.json";
import partiesJson from "@/data/parties.json";
import pollsJson from "@/data/polls.json";
import { COMMUNITIES, GUIDES, ISSUES } from "@/lib/articles";
import {canonicalNavPath,canonicalNavPaths} from "@/lib/navigation";
import { NAV } from "@/lib/site";

const BASE = "https://www.israelielection.org";

/** Pages with no dated data source take the build time. */
const BUILT = new Date();

const pollsUpdated = new Date(pollsJson.updated);
const briefingDates = (briefingsJson as { date: string }[]).map((b) => b.date).sort();
const newsUpdated = briefingDates.length ? new Date(briefingDates[briefingDates.length - 1]) : BUILT;

const POLL_DATED = new Set(["/", "/polls", "/parties", "/coalition-builder"]);

function lastModified(path: string): Date {
  if (POLL_DATED.has(path)) return pollsUpdated;
  if (path === "/news") return newsUpdated;
  return BUILT;
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
  return paths.map((path) => ({
    url: path === "/" ? BASE : `${BASE}${path}`,
    lastModified: lastModified(path),
  }));
}
