import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import partiesData from "@/data/parties.json";
import { comparisonIssues, evidenceLabel } from "./positions";
import { readIssue, stanceMap } from "./cohesion";

type Row = { party: string; text?: string | null; source?: string | null; url?: string | null; date?: string | null; stance?: string; status?: string; basis?: string; checked?: string };
type File = { issue: string; question?: string; stances?: { id: string; label: string }[]; rows: Row[] };
const dir = join(__dirname, "..", "data", "positions");
// Preserve validation of the seven full reference files; additional comparison evidence lives separately.
const files = readdirSync(dir).filter((f) => f.endsWith(".json"))
  .map((name) => ({ name, data: JSON.parse(readFileSync(join(dir, name), "utf8")) as File }));
const allIds = partiesData.parties.map((p) => p.id);
describe("full position reference files", () => {
  it("retains the seven complete reference files", () => {
    expect(files).toHaveLength(7);
    expect(files.every((f) => !!f.data.stances && !!f.data.question)).toBe(true);
  });
  for (const { name, data } of files) describe(name, () => {
    it("has a bounded set of unique, short options", () => {
      expect(data.question!.length).toBeLessThan(90);
      expect(data.stances!.length).toBeGreaterThanOrEqual(3);
      expect(data.stances!.length).toBeLessThanOrEqual(5);
      for (const stance of data.stances!) {
        expect(stance.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
        expect(stance.label.length).toBeLessThan(40);
      }
      expect(new Set(data.stances!.map((s) => s.id)).size).toBe(data.stances!.length);
    });
    it("has exactly one row for every list", () => {
      expect(data.rows.map((r) => r.party).sort()).toEqual([...allIds].sort());
    });
    it("has valid classifications and records dates for silence", () => {
      const options = new Set(data.stances!.map((s) => s.id));
      for (const r of data.rows) {
        if (r.stance !== undefined) {
          expect(options.has(r.stance), `${r.party}: ${r.stance}`).toBe(true);
          expect(r.status).toBeUndefined();
          expect(r.text).toBeTruthy();
        } else expect(["declined", "none"]).toContain(r.status);
        if (r.status === "none") expect(r.checked ?? r.date).toBeTruthy();
        if (r.basis !== undefined) expect(r.basis).toBe("record");
      }
    });
    it("sources every position and refusal with a dated HTTPS link", () => {
      for (const r of data.rows) {
        if (r.stance === undefined && r.status === "none" && !r.url) continue;
        const url = new URL(r.url!);
        expect(url.protocol).toBe("https:");
        expect(url.hostname).not.toMatch(/wikipedia\.org$/);
        expect(r.date).toBeTruthy();
      }
    });
  });
});

describe("comparable questions", () => {
  const issues = comparisonIssues();
  const ids = ["yashar", "byachad", "dem", "yb", "res", "rz", "shas", "utj"];
  const map = stanceMap(issues, ids);
  it("does not infer an override answer from compatible constitutional goals", () => {
    expect(map["courts-override"].byParty.byachad.kind).toBe("none");
    expect(readIssue("courts-override", map, ["yashar", "byachad"]).verdict).toBe("partial");
    expect(readIssue("courts-override", map, ["yashar", "res", "rz"]).verdict).toBe("split");
  });
  it("does not infer conversion policy from civil marriage support", () => {
    expect(readIssue("relig-marriage", map, ["yashar", "byachad", "dem", "yb"]).verdict).toBe("agree");
    expect(readIssue("relig-conversion", map, ["yashar", "byachad", "dem", "yb"]).verdict).toBe("partial");
    expect(readIssue("econ", map, ["yashar", "dem", "yb"]).verdict).toBe("unsorted");
    expect(readIssue("draft-left-yeshiva", map, ["shas", "utj"]).verdict).toBe("split");
    expect(readIssue("draft-exemptions", map, ["byachad", "dem", "yb"]).verdict).toBe("partial");
  });
  it("shows undated evidence as undated, and dates the pre-merger transport statement", () => {
    expect(evidenceLabel({ party: "x", source: "IDI guide", date: "Accessed Oct 2026" })).toContain("evidence date unavailable");
    expect(evidenceLabel(issues.find((i) => i.key === "relig-shabbat")!.file.rows.find((r) => r.party === "byachad"))).toContain("Apr 20, 2026");
  });
});
