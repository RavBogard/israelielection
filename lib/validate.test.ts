import { describe, expect, it } from "vitest";
import { parties, pollsData } from "./data";
import { currentPolls } from "./polls";
import type { Poll } from "./types";
import { validatePolls } from "./validate";

const config = pollsData.config;
const ids = new Set(parties.map((p) => p.id));
// The five hand-checked v2 polls: fixed, so these tests don't move as the polls job adds data.
const CURATED = ["maariv", "c13", "zman", "kan", "c14"];
const curated = pollsData.polls.filter((p) => CURATED.includes(p.id));
const maariv = curated.find((p) => p.id === "maariv")!;

/** A valid next Maariv poll: the Oct 2 numbers, a week later. */
function next(overrides: Partial<Poll> = {}): Poll {
  return {
    ...maariv,
    id: "maariv-2026-10-09",
    published: "2026-10-09",
    fieldwork: "Oct 7–8, 2026",
    results: structuredClone(maariv.results),
    ...overrides,
  };
}
const run = (p: Poll) => validatePolls([p], curated, config, ids, "2026-10-10").map((x) => x.rule);

describe("validatePolls", () => {
  it("passes a clean poll", () => {
    expect(run(next())).toEqual([]);
  });

  it("rejects seats that don't sum to 120", () => {
    const p = next();
    p.results.likud = { seats: 20 };
    expect(run(p)).toContain("sum");
  });

  it("rejects a pollster not on the whitelist", () => {
    expect(run(next({ pollster: "Some Blog" }))).toContain("pollster");
  });

  it("requires fieldwork and a sane publication date", () => {
    expect(run(next({ fieldwork: null }))).toContain("fieldwork");
    expect(run(next({ published: "2026-07-01" }))).toContain("date");
    expect(run(next({ published: "2026-11-01" }))).toContain("date");
  });

  it("rejects a move of more than 5 seats against the same pollster's previous poll", () => {
    const p = next();
    p.results.likud = { seats: 25 };
    p.results.yashar = { seats: 15 };
    expect(run(p)).toEqual(["move", "move"]);
  });

  it("accepts below-threshold parties at 0 and flags inconsistent ones", () => {
    const p = next();
    p.results.poi = { seats: 0, belowThreshold: true, pct: "2.9%" };
    p.results.likud = { seats: 23 };
    expect(run(p)).toEqual([]);
    p.results.poi = { seats: 4, belowThreshold: true };
    p.results.likud = { seats: 19 };
    expect(run(p)).toContain("threshold");
  });

  it("rejects non-http source links (Wikipedia is editable by anyone)", () => {
    expect(run(next({ url: "javascript:alert(1)" }))).toContain("url");
    expect(run(next({ url: "https://www.kan.org.il/x" }))).toEqual([]);
  });

  it("rejects 1–3 seat results, unknown parties, and duplicates", () => {
    const p = next();
    p.results.poi = { seats: 3 };
    p.results.likud = { seats: 20 };
    expect(run(p)).toContain("seats");
    const q = next();
    q.results.newparty = { seats: 4 };
    q.results.likud = { seats: 15 };
    expect(run(q)).toContain("party");
    expect(run(next({ published: "2026-10-02" }))).toContain("duplicate");
  });
});

describe("currentPolls", () => {
  it("keeps each pollster's latest poll in the window, Channel 14 included", () => {
    const main = currentPolls(curated, config);
    expect(main.map((p) => p.id)).toEqual(["maariv", "c13", "c14", "zman", "kan"]);
  });

  it("replaces a pollster's older poll and drops polls outside the window", () => {
    const newer = next({ id: "m2", published: "2026-10-20" });
    const main = currentPolls([...curated, newer], config);
    // Oct 20 minus 14 days = Oct 6: everything from Oct 2 and earlier falls out.
    expect(main.map((p) => p.id)).toEqual(["m2"]);
  });
});
