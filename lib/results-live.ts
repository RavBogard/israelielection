import configJson from "@/data/results.json";
import { parseExpc, resultsOpen, type Count, type ResultsConfig } from "./results";

export const resultsConfig = configJson as ResultsConfig;

export type Live =
  | { state: "closed" }
  | { state: "error"; fetchedAt: string }
  | { state: "open"; count: Count; fetchedAt: string };

/** The committee's count, or nothing before polls close (its file holds test data until then). */
export async function fetchCount(revalidate: number): Promise<Live> {
  // `next dev` only: RESULTS_FIXTURE=path/to/expc.csv previews the open page from a local file.
  if (process.env.NODE_ENV === "development" && process.env.RESULTS_FIXTURE) {
    const { readFileSync } = await import("node:fs");
    return { state: "open", count: parseExpc(readFileSync(process.env.RESULTS_FIXTURE, "utf8")), fetchedAt: new Date().toISOString() };
  }
  if (!resultsOpen(resultsConfig)) return { state: "closed" };
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(resultsConfig.source.url, {
      next: { revalidate },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; israelielection.org results reader; +https://www.israelielection.org)" },
    });
    if (!res.ok) return { state: "error", fetchedAt };
    const count = parseExpc(await res.text());
    return count.localities ? { state: "open", count, fetchedAt } : { state: "error", fetchedAt };
  } catch {
    return { state: "error", fetchedAt };
  }
}
