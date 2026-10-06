import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { allCharts, type Chart } from "./articles";
import { barRefs, clearLabels, count, formOf, HEAT_TOP, heatShare, isDate, listIn, pairs, sparks, stacks, transpose, wrapWords } from "./chart-form";
import { stackLanes } from "./timeline";

const charts = allCharts();
const table = (columns: string[], rows: [string, string[]][]): Chart => ({ title: "t", kind: "table", columns, rows: rows.map(([label, cells]) => ({ label, cells })), source: "s", url: "u", date: "d" });

describe("chart forms", () => {
  it("draws two-percentage cells as one panel of two lines per column, keeping each printed value", () => {
    const c = charts["settlers.vote-trend"];
    expect(formOf(c)).toBe("pairs");
    const p = pairs(c);
    expect(p.series).toEqual(["Settlements", "Israel"]);
    expect(p.panels.map((x) => x.title)).toEqual(["Religious-Zionist lists as they ran", "Likud", "Shas + UTJ"]);
    expect(p.panels[0].chart.rows[0].cells).toEqual(["33.8%", "9.7%"]);
    expect(p.max).toBe(40);
    for (const x of p.panels) expect(formOf(x.chart)).toBe("lines");
    // A percentage left in another column is not a pair table.
    expect(formOf(table(["Election", "Note", "A: x / y", "B: x / y", "C"], [["2019", ["n", "1% / 2%", "3% / 4%", "5%"]], ["2020", ["n", "1% / 2%", "3% / 4%", "5%"]], ["2021", ["n", "1% / 2%", "3% / 4%", "5%"]], ["2022", ["n", "1% / 2%", "3% / 4%", "5%"]]]))).not.toBe("pairs");
  });

  it("reads only bare dates as date headings", () => {
    expect(["2022", "Nov 2022", "March 2, 2020", "Apr 2019"].every(isDate)).toBe(true);
    expect(["Likud 2022", "Before the war", "Share"].some(isDate)).toBe(false);
  });

  it("turns community tables with elections across the columns into sparklines", () => {
    for (const id of ["secular.largest-list", "haredim.towns", "masorti.six-towns", "russian-speakers.yb-towns", "russian-speakers.likud-towns", "druze.vote"]) expect([id, formOf(charts[id])]).toEqual([id, "sparks"]);
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

describe("stacked bars", () => {
  it("draws counts that add up to a total column as one stacked bar per row", () => {
    expect(count("90,600")).toBe(90600);
    expect(count("90,60")).toBeNull();
    const c = charts["ethiopian-israelis.population"];
    expect(formOf(c)).toBe("stack");
    const s = stacks(c);
    expect(s.parts).toEqual(["Born in Ethiopia", "Born in Israel"]);
    expect(s.max).toBe(171600);
    expect(s.rows.map((r) => [r.row.label, r.values, r.total])).toEqual([["2021", [90600, 73800], "164,400"], ["2023", [93600, 78000], "171,600"]]);
    // Parts that do not add up to the total stay a table.
    expect(formOf(table(["Year", "A", "B", "Total"], [["2021", ["1", "2", "9"]]]))).toBe("table");
  });
});

describe("chart labels", () => {
  it("wraps a line's end label at words, starting below the value when the first word will not fit beside it", () => {
    expect(wrapWords("Palestinian citizens of Israel", 19, 24)).toEqual(["Palestinian", "citizens of Israel"]);
    expect(wrapWords("Jews", 19, 24)).toEqual(["Jews"]);
    expect(wrapWords("Palestinian citizens", 5, 24)).toEqual(["", "Palestinian citizens"]);
  });

  it("lists a sparkline's names under it when one will not fit its room", () => {
    const otzma = sparks(charts["masorti.six-towns"]).rows.find((r) => /Otzma/.test(r.row.label))!;
    expect(otzma.flow.s).toBe(true);
    expect(otzma.labels[0]).toMatchObject({ list: "Union of Right-Wing Parties", from: "Apr 2019" });
    expect(sparks(charts["secular.largest-list"]).rows[0].flow).toMatchObject({ s: false, l: false });
  });
});

/*
 * Heat cells mix the theme's ink into its page ground (color-mix in oklab), up to HEAT_TOP, under ink
 * text: every step must keep that text at 4.5:1 in light and dark.
 */
describe("heat shading", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const dark = css.slice(css.indexOf(':root[data-theme="dark"]'));
  const token = (name: string, from: string) => from.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))![1];
  type RGB = [number, number, number];
  const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const gam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  const toLab = (rgb: RGB): RGB => {
    const [r, g, b] = rgb.map(lin);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  };
  const toRgb = ([L, a, b]: RGB): RGB => {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const out = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
    return out.map((c) => Math.round(Math.min(1, Math.max(0, gam(c))) * 255) / 255) as RGB;
  };
  const lum = (rgb: RGB) => { const [r, g, b] = rgb.map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a: RGB, b: RGB) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

  it("scales a cell from none to HEAT_TOP at the scale maximum", () => {
    expect(heatShare("0%", 50)).toBe(0);
    expect(heatShare("Religious Zionism 25%", 50)).toBe(HEAT_TOP / 2);
    expect(heatShare("60%", 50)).toBe(HEAT_TOP);
    expect(heatShare("n/a", 50)).toBeNull();
  });

  it("keeps ink text at 4.5:1 on every step, light and dark", () => {
    for (const [theme, from] of [["light", css], ["dark", dark]] as const) {
      const ink = hex(token("ink", from)), bg = toLab(hex(token("bg", from))), il = toLab(ink);
      for (let k = 0; k <= HEAT_TOP; k++) {
        const cell = toRgb(il.map((v, i) => (v * k + bg[i] * (100 - k)) / 100) as RGB);
        expect(contrast(ink, cell), `${theme}, ${k}%`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe("timeline lanes", () => {
  it("stacks marks closer than the gap", () => {
    expect(stackLanes([0, 0.01, 0.02, 0.5, 0.505], 0.015)).toEqual([0, 1, 0, 0, 1]);
  });
});
