import { describe, expect, it } from "vitest";
import { allCharts, type Chart } from "./articles";
import { barRefs, clearLabels, formOf, isDate, listIn, sparks, transpose } from "./chart-form";
import { stackLanes } from "./timeline";

const charts = allCharts();
const table = (columns: string[], rows: [string, string[]][]): Chart => ({ title: "t", kind: "table", columns, rows: rows.map(([label, cells]) => ({ label, cells })), source: "s", url: "u", date: "d" });

describe("chart forms", () => {
  it("reads only bare dates as date headings", () => {
    expect(["2022", "Nov 2022", "March 2, 2020", "Apr 2019"].every(isDate)).toBe(true);
    expect(["Likud 2022", "Before the war", "Share"].some(isDate)).toBe(false);
  });

  it("turns community tables with elections across the columns into sparklines", () => {
    for (const id of ["secular.largest-list", "haredim.towns", "masorti.six-towns", "russian-speakers.yb-towns", "russian-speakers.likud-towns"]) expect([id, formOf(charts[id])]).toEqual([id, "sparks"]);
  });

  it("keeps the forms that already worked", () => {
    expect(formOf(charts["courts.trust"])).toBe("lines");
    expect(formOf(charts["courts.trust-groups"])).toBe("dots");
    expect(formOf(charts["masorti.towns-2022"])).toBe("heat");
    expect(formOf(charts["haredim.employment"])).toBe("heat");
    expect(formOf(charts["seats.leftover-2022"])).toBe("table");
  });

  it("draws up to four rows as lines, transposed so the dates run down", () => {
    const c = table(["List", "Apr 2019", "Sep 2019", "Mar 2020"], [["A", ["10%", "12%", "–"]], ["B", ["Blue 30%", "Blue 28%", "Red 20%"]]]);
    expect(formOf(c)).toBe("trend");
    const t = transpose(c);
    expect(t.columns).toEqual(["List", "A", "B"]);
    expect(t.rows.map((r) => [r.label, r.cells])).toEqual([["Apr 2019", ["10%", "Blue 30%"]], ["Sep 2019", ["12%", "Blue 28%"]], ["Mar 2020", ["–", "Red 20%"]]]);
  });

  it("names each change of list under a sparkline and breaks the line at a gap", () => {
    expect(listIn("Blue and White 45.7%")).toBe("Blue and White");
    expect(listIn("13.0% (URWP)")).toBe("URWP");
    const s = sparks(charts["secular.largest-list"]);
    expect(s.max).toBe(60);
    expect(s.cols[0].at).toBe(0);
    expect(s.cols.at(-1)!.at).toBe(1);
    const tlv = s.rows[0];
    expect(tlv.labels.map((l) => l.list)).toEqual(["Blue and White", "Yesh Atid"]);
    expect(tlv.lanes).toBe(1);
    // Labor in 2021, then Yesh Atid at the last election: too close for one lane.
    const kib = s.rows.find((r) => /Kibbutz/.test(r.row.label))!;
    expect(kib.labels.map((l) => [l.list, l.lane, l.end])).toEqual([["Blue and White", 0, false], ["Labor", 1, false], ["Yesh Atid", 0, true]]);
    const alone = sparks(charts["haredim.towns"]).rows.find((r) => /running alone/.test(r.row.label))!;
    expect(alone.runs.map((r) => r.map((p) => p.j))).toEqual([[1, 2]]);
  });

  it("keeps x labels clear of each other, first and last always", () => {
    expect(clearLabels([0, 0.1, 0.3, 0.5, 1], 0.2)).toEqual([0, 2, 3, 4]);
  });

  it("draws the threshold row as a rule and adds 61 to seat charts", () => {
    const t = charts["seats.threshold-2022"];
    const { rows, refs } = barRefs(t, (r) => `${r.value}%`);
    expect(rows.some((r) => /threshold/i.test(r.label))).toBe(false);
    expect(rows).toHaveLength(t.rows.length - 1);
    expect(refs).toEqual([{ label: "The threshold, 3.25%", value: 3.25, heavy: false }]);
    expect(barRefs(charts["forming-a-government.coalition-size"], String).refs).toEqual([{ label: "61 seats, a majority", value: 61, heavy: true }]);
  });
});

describe("timeline lanes", () => {
  it("stacks marks closer than the gap", () => {
    expect(stackLanes([0, 0.01, 0.02, 0.5, 0.505], 0.015)).toEqual([0, 1, 0, 0, 1]);
  });
});
