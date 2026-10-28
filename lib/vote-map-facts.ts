import { readFileSync } from "node:fs";
import path from "node:path";
import { HISTORY_ELECTIONS } from "./locality-history";
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
/** Server only: counts the historical elections the map ships and reads the date their files were fetched, so the guide never states either by hand. */
export function voteMapFacts() {
  const fetched: string[] = [];
  for (const id of HISTORY_ELECTIONS) {
    try {
      const file = JSON.parse(readFileSync(path.join(process.cwd(), "public", "vote-map", `${id}.json`), "utf8"));
      if (typeof file?.source?.fetched === "string") fetched.push(file.source.fetched);
    } catch {
      /* a missing file only leaves the date out */
    }
  }
  const n = HISTORY_ELECTIONS.length;
  return { count: n, countWord: WORDS[n] ?? String(n), snapshot: fetched.sort().at(-1) ?? null };
}
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const longEnglishDate = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}, ${iso.slice(0, 4)}`;
