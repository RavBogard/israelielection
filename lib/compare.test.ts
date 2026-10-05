import { describe, expect, it } from "vitest";
import stateFile from "@/data/positions/palestinian-state.json";
import { averagePoll, parties } from "./data";
import { AXES, cellsFor, defaultSelection, isUrl, parseSelection, rowCell, toggle, type PositionRow } from "./compare";
import type { Party } from "./types";

const rows = stateFile.rows as PositionRow[];
const pickable = parties.filter((p) => p.coalitionCard !== "hidden");
const ids = pickable.map((p) => p.id);

describe("AXES", () => {
  it("has the six issue keys then the Palestinian state, with plain labels", () => {
    expect(AXES.map((a) => a.key)).toEqual(["draft", "courts", "war", "wb", "relig", "econ", "pstate"]);
    expect(AXES.at(-1)!.label).toBe("A Palestinian state");
  });
});

describe("defaultSelection", () => {
  it("takes the four largest by average seats", () => {
    const d = defaultSelection(ids, averagePoll.results);
    expect(d).toHaveLength(4);
    const seats = d.map((id) => averagePoll.results[id]?.seats ?? -1);
    expect([...seats].sort((a, b) => b - a)).toEqual(seats);
    const fifth = Math.max(...ids.filter((id) => !d.includes(id)).map((id) => averagePoll.results[id]?.seats ?? -1));
    expect(Math.min(...seats)).toBeGreaterThanOrEqual(fifth);
  });

  it("puts unpolled lists last", () => {
    expect(defaultSelection(["a", "b", "c"], { c: { seats: 3 } }, 2)).toEqual(["c", "a"]);
  });
});

describe("parseSelection", () => {
  const fb = ["likud", "shas"];
  it("keeps known ids in order, drops unknown and repeated ones, caps at four", () => {
    expect(parseSelection("byachad,LIKUD, nope,likud,shas,utj,rz", ids, fb)).toEqual(["byachad", "likud", "shas", "utj"]);
  });
  it("falls back when missing or under two parties", () => {
    expect(parseSelection(null, ids, fb)).toBe(fb);
    expect(parseSelection("", ids, fb)).toBe(fb);
    expect(parseSelection("likud", ids, fb)).toBe(fb);
    expect(parseSelection("noam,likud", ids, fb)).toBe(fb); // noam is hidden from the picker
  });
});

describe("toggle", () => {
  it("adds up to four and removes down to two", () => {
    expect(toggle(["a", "b"], "c")).toEqual(["a", "b", "c"]);
    expect(toggle(["a", "b", "c", "d"], "e")).toEqual(["a", "b", "c", "d"]);
    expect(toggle(["a", "b", "c"], "b")).toEqual(["a", "c"]);
    expect(toggle(["a", "b"], "a")).toEqual(["a", "b"]);
  });
});

describe("cells", () => {
  it("gives every pickable party all seven cells, empty ones marked none", () => {
    for (const p of pickable) {
      const c = cellsFor(p, rows);
      expect(Object.keys(c).sort()).toEqual(AXES.map((a) => a.key).sort());
      for (const a of AXES) if (a.key !== "pstate" && !p.issues?.[a.key]) expect(c[a.key]).toEqual({ kind: "none" });
    }
  });

  it("a party with no issues has six empty cells", () => {
    const bare = { ...pickable[0], id: "zz", issues: null } as Party;
    const c = cellsFor(bare, rows);
    expect(Object.values(c).every((x) => x.kind === "none")).toBe(true);
  });

  it("maps a positions row's text, source, date and url", () => {
    const likud = cellsFor(parties.find((p) => p.id === "likud")!, rows).pstate;
    // Likud declined Ynet's questionnaire, but its campaign video is on the record (basis "record").
    expect(likud.kind).toBe("position");
    if (likud.kind === "position") expect(likud.url).toMatch(/^https:\/\//);
    expect(rowCell({ party: "x", text: "T", source: "Ynet", url: "https://a.b/c", date: "Sept 30, 2026" })).toEqual({
      kind: "position",
      text: "T",
      source: "Ynet, Sept 30, 2026",
      url: "https://a.b/c",
    });
    expect(rowCell({ party: "x", text: "T", source: "Ynet, Sept 30, 2026", url: null, date: "Sept 30, 2026" })).toMatchObject({ source: "Ynet, Sept 30, 2026", url: null });
  });

  it("marks declined rows and treats a missing or empty row as no position", () => {
    expect(rowCell({ party: "x", declined: true, source: "Ynet" }).kind).toBe("declined");
    expect(rowCell(undefined)).toEqual({ kind: "none" });
    expect(rowCell({ party: "x", text: "  " })).toEqual({ kind: "none" });
  });

  it("links only real URLs", () => {
    expect(isUrl("https://www.ynetnews.com/x")).toBe(true);
    expect(isUrl("be-yahad.org.il")).toBe(false);
    expect(isUrl("Ynet, Sep 22, 2026")).toBe(false);
    expect(isUrl(null)).toBe(false);
  });
});
