import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COUNT_TIMELINE, currentElection, electionById, electionByRef, isCurrentElectionRef } from "./political-record/elections";

const ROOT = path.resolve(__dirname, "..");
const SCAN = ["app", "components", "lib", "scripts/election-lifecycle", "scripts/jobs", "scripts/live-count", ".github/workflows"];
const SKIP = [/\.test\.tsx?$/, /[\/]fixtures?[\/]/, /[\/]node_modules[\/]/, /lib[\/]political-record[\/]elections\.ts$/, /[\/]data[\/]/];
const BARE = /2026-10-27|il-knesset-26/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}
/** Comments may name the election day; code may not. */
const code = (line: string) => {
  const t = line.trim();
  if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t.startsWith("#")) return "";
  return line.replace(/\s\/\/.*$/, "");
};

describe("one election config", () => {
  it("keeps the election day and id out of code outside the registry, fixtures and data", () => {
    const hits: string[] = [];
    for (const dir of SCAN)
      for (const file of files(path.join(ROOT, dir))) {
        if (!/\.(tsx?|mts|mjs|yml)$/.test(file) || SKIP.some((re) => re.test(file))) continue;
        readFileSync(file, "utf8").split(/\r?\n/).forEach((line, i) => {
          if (BARE.test(code(line))) hits.push(`${path.relative(ROOT, file)}:${i + 1}`);
        });
      }
    expect(hits).toEqual([]);
  });
  it("resolves the public aliases to the canonical id", () => {
    const id = currentElection().id;
    for (const ref of [id, currentElection().electionDay, "2026", String(currentElection().termNumber)])
      expect(electionByRef(ref)?.id).toBe(id);
    expect(isCurrentElectionRef("2026")).toBe(true);
    expect(isCurrentElectionRef("2019a")).toBe(false);
    expect(electionById(id)?.electionDay).toBe(currentElection().electionDay);
  });
  it("derives the count windows from the config", () => {
    expect(COUNT_TIMELINE.pollsClose).toBe(Date.parse(currentElection().pollsClose));
    expect(COUNT_TIMELINE.regularStart).toBeGreaterThan(COUNT_TIMELINE.pollsClose);
    expect(COUNT_TIMELINE.countWindowEnd).toBeGreaterThan(COUNT_TIMELINE.regularStart);
  });
});
