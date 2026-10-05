/**
 * Rehearsal check for election night (run locally: GitHub runners get a 404 from the
 * committee's CDN; Vercel iad1 gets the file): can this machine reach the committee's file, and do its
 * column letters match data/results.json? Prints a report; exits 1 if the file is unreachable.
 *
 *   tsx scripts/jobs/results-check.mts
 */
import { results, parseExpc } from "../../lib/results";
import { resultsConfig as cfg } from "../../lib/results-live";

const res = await fetch(cfg.source.url, {
  headers: { "User-Agent": "Mozilla/5.0 (compatible; israelielection.org results reader; +https://www.israelielection.org)" },
});
console.log(`${cfg.source.url}: HTTP ${res.status}, ${res.headers.get("last-modified") ?? "no Last-Modified"}`);
if (!res.ok) process.exit(1);
const count = parseExpc(await res.text());
const r = results(count, cfg);
const missing = Object.entries(cfg.letters).filter(([l]) => !(l in count.votes));
console.log(`${count.localities} localities, ${count.valid} valid votes, ${Object.keys(count.votes).length} letter columns.`);
console.log(missing.length ? `Configured letters NOT in the file: ${missing.map(([l, id]) => `${l} (${id})`).join(", ")}` : "Every configured letter is in the file.");
console.log(`Columns the site doesn't map: ${r.unknownLetters.join(" ") || "none"}`);
