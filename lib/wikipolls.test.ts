import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import pollSources from "@/data/poll-sources.json";
import { parties, pollsData } from "./data";
import { importFromWikitext } from "./pollimport";
import { parseOpdrts, parseReading, parseTable, seatTables } from "./wikipolls";

// Header + first rows of the live table, Wikipedia revision 1378526425 (2026-10-04).
const fixture = readFileSync(new URL("./fixtures/wiki-seat-table.txt", import.meta.url), "utf8");
const ids = new Set(parties.map((p) => p.id));

describe("wikitext cells", () => {
  it("reads Opdrts dates, including ranges across a month boundary", () => {
    expect(parseOpdrts("{{Opdrts||4|Oct|2026}}")).toEqual({ end: "2026-10-04", fieldwork: "Oct 4, 2026" });
    expect(parseOpdrts("{{Opdrts|30|1|Oct|2026}}")).toEqual({ end: "2026-10-01", fieldwork: "Sep 30–Oct 1, 2026" });
    expect(parseOpdrts("{{Opdrts|7|8|September|2026}}")?.fieldwork).toBe("Sep 7–8, 2026");
  });

  it("reads seats, below-threshold percentages and missing values", () => {
    expect(parseReading(`style="background:#BBCDE4" |'''28'''`)).toBeNull(); // attrs are split off before this call
    expect(parseReading("'''28'''")).toEqual({ seats: 28 });
    expect(parseReading("{{small|(1.3%)}}")).toEqual({ below: true, pct: "1.3%" });
    expect(parseReading("{{small|(1)}}")).toEqual({ below: true, pct: null });
    expect(parseReading("{{n/a}}")).toBeNull();
    expect(parseReading("{{N/A}}{{efn|Noam is below the threshold}}")).toBeNull();
  });
});

describe("parseTable on the live table", () => {
  const [table] = seatTables(fixture);
  const parsed = parseTable(table);

  it("expands merged header columns", () => {
    const targets = parsed.columns.filter((c) => c.kind === "party").map((c) => c.target);
    expect(targets.slice(0, 4)).toEqual(["Likud", "Together (Israel)", "Religious Zionist Party", "Zehut"]);
    expect(targets).toContain("New Economic Party");
  });

  it("skips event rows and keeps polls", () => {
    expect(parsed.polls.map((p) => `${p.publisherTarget} ${p.end}`)).toEqual([
      "Kan 11 2026-10-04",
      "i24NEWS (Israeli TV channel) 2026-10-01",
      "Channel 14 (Israel) 2026-10-01",
      "Zman Yisrael 2026-10-01",
      "Maariv (newspaper) 2026-10-01",
    ]);
  });

  it("reads a colspan=2 cell once and the citation's publication date", () => {
    const i24 = parsed.polls[1];
    expect(i24.readings.get("Religious Zionist Party")).toEqual({ seats: 5 });
    expect(i24.readings.has("Zehut")).toBe(false);
    expect(i24.readings.get("The Reservists (political party)")).toEqual({ below: true, pct: "1.81%" });
    expect(i24.ref.date).toBe("2026-10-02");
    expect(i24.sample).toBe(504);
  });
});

describe("importFromWikitext", () => {
  // Against the five hand-checked v2 polls only, so the test doesn't move as the job adds data.
  const curated = { ...pollsData, polls: pollsData.polls.filter((p) => ["maariv", "c13", "zman", "kan", "c14"].includes(p.id)) };
  const report = importFromWikitext(fixture, "fixture", pollSources.wikipedia, curated, ids, "2026-10-05");

  it("recognizes polls we already hold", () => {
    const got = [...report.accepted, ...report.review.map((r) => r.poll)].map((p) => p.pollster);
    // Channel 14, Zman Yisrael and Maariv of Oct 1–2 are the curated v2 polls.
    expect(got).toEqual(expect.not.arrayContaining(["Channel 14", "Zman Yisrael", "Maariv"]));
  });

  it("merges the clean i24 poll and sends Kan's 123-seat row to review", () => {
    expect(report.accepted.map((p) => p.id)).toEqual(["i24news-2026-10-02"]);
    expect(report.review.map((r) => [r.poll.id, r.problems.map((p) => p.rule)])).toEqual([["kan-11-2026-10-04", ["sum"]]]);
  });
});
