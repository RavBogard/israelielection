// Runs before `next build` / `next dev`: gathers data/briefings/YYYY-MM-DD.json into one
// generated file the site imports. Deleting a day's file (the kill switch) drops it on the next build.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const dir = "data/briefings";
const days = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse();
const all = days.slice(0, 60).map((f) => JSON.parse(readFileSync(`${dir}/${f}`, "utf8")));
writeFileSync(`${dir}/_index.json`, JSON.stringify(all) + "\n");
console.log(`briefings index: ${all.length}`);

// Days the job ran but published nothing (sources not verified). Only days newer than the newest briefing matter to readers.
const sdir = `${dir}/suppressed`;
const have = new Set(all.map((b) => b.date));
const suppressed = existsSync(sdir)
  ? readdirSync(sdir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse().slice(0, 14)
      .map((f) => JSON.parse(readFileSync(`${sdir}/${f}`, "utf8"))).filter((x) => !have.has(x.date)).map(({ date, checkedAt }) => ({ date, checkedAt }))
  : [];
writeFileSync(`${dir}/_suppressed.json`, JSON.stringify(suppressed) + "\n");
