import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { binOf, decodeArcs, englishName, isEnvelopeCode, ringsOf, splitCsv, type Places, type Topology, type VoteMapElection } from "./votemap";

const pub = (f: string) => JSON.parse(readFileSync(path.join(process.cwd(), "public/vote-map", f), "utf8"));
const IDS = ["2022", "2021", "2020", "2019b", "2019a"];

describe("vote map helpers", () => {
  it("splits a CEC file and drops the trailing empty column", () => {
    const { head, rows } = splitCsv("﻿שם ישוב,סמל ישוב,כשרים,מחל,\nא,1,10,10,\r\nshort\n");
    expect(head).toEqual(["שם ישוב", "סמל ישוב", "כשרים", "מחל"]);
    expect(rows).toEqual([["א", "1", "10", "10"]]);
  });
  it("knows both envelope codes", () => {
    expect([9999, 99999, 3000].map(isEnvelopeCode)).toEqual([true, true, false]);
  });
  it("uses house spellings, then common transliteration", () => {
    expect(englishName(6100, "Bene Beraq")).toBe("Bnei Brak");
    expect(englishName(2620, "Qiryat Ono")).toBe("Kiryat Ono");
    expect(englishName(3575, "Bet Horon")).toBe("Beit Horon");
    expect(englishName(1, null)).toBeNull();
  });
  it("bins shares", () => {
    expect([0, 0.019, 0.02, 0.1, 0.49, 0.5, 1].map(binOf)).toEqual([0, 0, 1, 3, 5, 6, 6]);
  });
  it("decodes delta-encoded arcs and joins rings", () => {
    const t: Topology = {
      type: "Topology",
      transform: { scale: [1, 1], translate: [10, 20] },
      arcs: [[[0, 0], [1, 0], [0, 1]], [[1, 1], [-1, 0], [0, -1]]],
      objects: { merged: { type: "GeometryCollection", geometries: [{ type: "Polygon", arcs: [[0, 1]], properties: { code: 1, src: "x" } }] } },
    };
    const arcs = decodeArcs(t);
    expect(arcs[0]).toEqual([[10, 20], [11, 20], [11, 21]]);
    expect(ringsOf(t.objects.merged.geometries[0], arcs)).toEqual([[[10, 20], [11, 20], [11, 21], [10, 21], [10, 20]]]);
    expect(ringsOf({ type: "Polygon", arcs: [[~0]], properties: { code: 1, src: "x" } }, arcs)[0][0]).toEqual([11, 21]);
  });
});

describe("vote map files", () => {
  const places: Places = pub("places.json");
  const topo: Topology = pub("boundaries.topo.json");
  const ctx = pub("context.json");

  for (const id of IDS) {
    it(`${id}: totals add up and every locality is named`, () => {
      const e: VoteMapElection = pub(`${id}.json`);
      const n = e.lists.length;
      let valid = e.envelopes.valid;
      const listSums = e.envelopes.votes.slice();
      for (const r of e.rows) {
        expect(r.length).toBe(4 + n);
        expect(isEnvelopeCode(r[0])).toBe(false);
        const named = r.slice(4).reduce((a, b) => a + b, 0);
        expect(named).toBeLessThanOrEqual(r[3]);
        valid += r[3];
        r.slice(4).forEach((v, i) => (listSums[i] += v));
        expect(places[r[0]]?.[0], `locality ${r[0]}`).toBeTruthy();
      }
      expect(valid).toBe(e.national.valid);
      e.lists.forEach((l, i) => expect(listSums[i], l.name).toBe(l.votes));
      for (const l of e.lists) expect(l.votes / e.national.valid).toBeGreaterThanOrEqual(0.01);
      expect(e.envelopes.valid / e.national.valid).toBeGreaterThan(0.05);
      expect(e.source.csv).toMatch(/^https:\/\/media2\d\.bechirot\.gov\.il\/files\/expc\.csv$/);
    });
  }

  it("never joins the West Bank blob or the envelope code to a shape", () => {
    const codes = topo.objects.merged.geometries.map((g) => g.properties.code);
    expect(codes).not.toContain(9999);
    expect(codes).not.toContain(99999);
  });

  it("puts every 2022 locality but Hebron on the map", () => {
    const e: VoteMapElection = pub("2022.json");
    const shaped = new Set(topo.objects.merged.geometries.map((g) => g.properties.code));
    const off = e.rows.filter((r) => !shaped.has(r[0]) && !places[r[0]][1]).map((r) => r[0]);
    expect(off).toEqual([3400]);
  });

  it("has West Bank and Gaza outlines with a source", () => {
    expect(ctx.westBank[0].length).toBeGreaterThan(100);
    expect(ctx.gaza[0].length).toBeGreaterThan(10);
    expect(ctx.source.url).toMatch(/^https:\/\/data\.humdata\.org\//);
  });
});
