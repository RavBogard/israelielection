import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COMMUNITIES, GUIDES, ISSUES } from "./articles";
import { anchorOf, initialOf, sortKey, type Glossary } from "./glossary";
import { electionAt, eventAt, governmentAt, labelOf, longDate, monthOf, type Timeline } from "./timeline";

/* The timeline and the glossary: helpers, then the proof rules on their data. */

const load = <T,>(f: string): T | null => {
  const p = path.join(process.cwd(), f);
  return existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as T) : null;
};
const ISO = /^\d{4}-\d\d-\d\d$/;
const ROUTES = new Set([
  "/how-it-works", "/vote-map", "/results", "/polls", "/parties", "/american-lens", "/timeline", "/issues", "/communities",
  ...GUIDES.map((s) => `/how-it-works/${s}`),
  ...ISSUES.map((s) => `/issues/${s}`),
  ...COMMUNITIES.map((s) => `/communities/${s}`),
]);

/** The house terminology and spelling rulings that can be checked on any text. */
function terminology(text: string) {
  expect(text).not.toMatch(/support (a |the )?two[- ]state/i); // 20
  expect(text).not.toMatch(/draft[- ]dodg/i); // 14
  expect(text).not.toMatch(/regime coup|judicial reform\b/i); // 38
  expect(text).not.toMatch(/war aliyah|Second Israel/i); // 72, 80
  expect(text).not.toMatch(/Lieberman|B'nei Brak|Bene Beraq|Modiin Illit|Maale Adumim|Bet Shemesh|Kiryat Arbah/); // 32
  expect(text).not.toMatch(/\(unverified\)|unverified|reportedly|\bTODO\b|\bTK\b/i); // 26
  expect(text.replace(/"[^"]*"|“[^”]*”/g, "")).not.toMatch(/\b(I|I'm|I've|we|our|my)\b/); // quoted words are the speaker's
}

function source(s: { name: string; date: string; url: string }) {
  expect(s.name.length).toBeGreaterThan(1);
  expect(s.url).toMatch(/^https:\/\//);
  expect(s.url).not.toMatch(/wikipedia\.org/);
  expect(typeof s.date).toBe("string");
}

describe("timeline helpers", () => {
  it("counts months from January 1977", () => {
    expect(monthOf("1977-01-31")).toBe(0);
    expect(monthOf("1977-05-17")).toBe(4);
    expect(monthOf("2026-10-27")).toBe(49 * 12 + 9);
    expect(labelOf(4)).toEqual({ year: 1977, month: "May" });
    expect(longDate("1977-05-17")).toBe("May 17, 1977");
  });
  it("finds what was in force at a month", () => {
    const src = { name: "x", date: "", url: "https://x" };
    const gs = [
      { pm: "A", party: "P", from: "1977-06-20", to: "1983-10-10", source: src },
      { pm: "B", party: "Q", from: "1983-10-10", to: "", source: src },
    ];
    expect(governmentAt(gs, monthOf("1977-05-01"))).toBeUndefined();
    expect(governmentAt(gs, monthOf("1983-10-01"))?.pm).toBe("B");
    const evs = [
      { date: "1977-05-17", title: "a", text: "", kind: "politics" as const, source: src },
      { date: "1979-03-26", title: "b", text: "", kind: "peace" as const, source: src },
    ];
    expect(eventAt(evs, 3)).toBe(-1);
    expect(eventAt(evs, monthOf("1980-01-01"))).toBe(1);
    const es = [{ date: "1977-05-17", knesset: 9, first: { list: "L", seats: 43 }, second: { list: "A", seats: 32 }, outcome: "", source: src }];
    expect(electionAt(es, 3)).toBeUndefined();
    expect(electionAt(es, 4)?.knesset).toBe(9);
  });
});

describe("glossary helpers", () => {
  it("files and anchors terms", () => {
    expect(sortKey("The Status Quo")).toBe("status quo");
    expect(initialOf("Bader–Ofer method")).toBe("B");
    expect(anchorOf("Area C")).toBe("area-c");
    expect(anchorOf("Torato Umanuto")).toBe("torato-umanuto");
    expect(anchorOf("Ra'am")).toBe("raam");
  });
});

const tl = load<Timeline>("data/timeline.json");
describe.runIf(tl)("timeline data", () => {
  const t = tl!;
  it("is dated", () => expect(t.checked).toMatch(ISO));
  it("has every Knesset election from 1977 to 2022, in order", () => {
    expect(t.elections.map((e) => e.knesset)).toEqual(Array.from({ length: 17 }, (_, i) => 9 + i));
    for (const e of t.elections) {
      expect(e.date).toMatch(ISO);
      expect(e.first.seats).toBeGreaterThanOrEqual(e.second.seats);
      expect(e.first.seats + e.second.seats).toBeLessThanOrEqual(120);
      if (e.turnout !== undefined) expect(e.turnout).toBeGreaterThan(50);
      expect(e.outcome.length).toBeGreaterThan(10);
      source(e.source);
      if (e.outcomeSource) source(e.outcomeSource);
      terminology(e.outcome);
    }
    expect([...t.elections].sort((a, b) => a.date.localeCompare(b.date))).toEqual(t.elections);
  });
  it("has prime ministers' terms that follow one another", () => {
    t.governments.forEach((g, i) => {
      expect(g.from).toMatch(ISO);
      if (i < t.governments.length - 1) {
        expect(g.to).toMatch(ISO);
        expect(t.governments[i + 1].from >= g.from).toBe(true);
      } else expect(g.to).toBe("");
      source(g.source);
    });
  });
  it("has sourced events in date order", () => {
    expect(t.events.length).toBeGreaterThanOrEqual(30);
    for (const e of t.events) {
      expect(e.date).toMatch(ISO);
      expect(e.date <= t.checked).toBe(true);
      expect(["war", "peace", "politics", "law", "society"]).toContain(e.kind);
      expect(e.title.length).toBeLessThanOrEqual(60);
      expect(e.text.length).toBeLessThanOrEqual(280);
      source(e.source);
      terminology(`${e.title} ${e.text}`);
      expect(`${e.title} ${e.text}`).not.toMatch(/Judea and Samaria/); // 2
    }
    expect([...t.events].sort((a, b) => a.date.localeCompare(b.date))).toEqual(t.events);
    // Ruling: "ultra-Orthodox" at most once in the site's own voice.
    expect((JSON.stringify(t).match(/ultra-Orthodox/g) ?? []).length).toBeLessThanOrEqual(1);
  });
});

const gl = load<Glossary>("data/glossary.json");
describe.runIf(gl)("glossary data", () => {
  const g = gl!;
  it("is dated, alphabetical and unique", () => {
    expect(g.checked).toMatch(ISO);
    const keys = g.terms.map((t) => sortKey(t.term));
    expect([...keys].sort((a, b) => a.localeCompare(b))).toEqual(keys);
    expect(new Set(g.terms.map((t) => anchorOf(t.term))).size).toBe(g.terms.length);
  });
  it("defines every term from a source, in the house terms", () => {
    for (const t of g.terms) {
      expect(t.def.length).toBeGreaterThan(20);
      expect(t.def.length).toBeLessThanOrEqual(400);
      if (t.hebrew !== undefined) expect(t.hebrew).toMatch(/[֐-׿]/);
      for (const h of t.see ?? []) expect(ROUTES.has(h), `see ${h}`).toBe(true);
      source(t.source);
      terminology(t.def);
      // "Judea and Samaria" only where the name itself is being explained (ruling 2).
      if (!/Judea and Samaria|West Bank/.test(t.term)) expect(t.def).not.toMatch(/Judea and Samaria/);
    }
    expect((JSON.stringify(g).match(/ultra-Orthodox/g) ?? []).length).toBeLessThanOrEqual(1);
  });
});
