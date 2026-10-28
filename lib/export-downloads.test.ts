import { describe, expect, it, vi } from "vitest";
vi.mock("./election-lifecycle/server", () => ({ getSharedSeatContext: async () => ({ state: "unavailable", reason: "source_unavailable", revision: "" }) }));
vi.mock("./results-live", async (original) => ({
  ...(await original<typeof import("./results-live")>()),
  fetchCount: async () => ({ state: "closed" }),
}));
import { buildExport } from "./export-data";
import { exportCsv } from "./export";

const q = (lang?: string) => new URLSearchParams(lang ? { lang } : {});

describe("results, polls and forecast downloads", () => {
  it("polls: campaign polls only, with source, retrieved-at and licence on every row, set-apart houses marked", async () => {
    const model = (await buildExport("polls", q()))!;
    const h = (name: string) => model.headers.indexOf(name);
    expect(model.headers).toEqual(expect.arrayContaining(["Source", "Source link", "Retrieved at", "Licence"]));
    expect(model.rows.length).toBeGreaterThan(100);
    for (const row of model.rows) {
      expect(row[h("Retrieved at")]).toBeTruthy();
      expect(row[h("Licence")]).toBeTruthy();
    }
    const channel14 = model.rows.filter((r) => r[h("Pollster")] === "Channel 14");
    expect(channel14.length).toBeGreaterThan(0);
    expect(channel14.every((r) => /set apart/.test(String(r[h("In the poll average")])))).toBe(true);
  });
  it("forecast: one row per list with its seat range and the frozen note", async () => {
    const model = (await buildExport("forecast", q()))!;
    expect(model.rows.length).toBeGreaterThan(10);
    expect(model.assumptions.join(" ")).toMatch(/Frozen before the vote/);
    expect(exportCsv(model)).toContain("Licence");
  });
  it("results: says plainly when the count is unavailable and invents no figures", async () => {
    const model = (await buildExport("results", q()))!;
    expect(model.rows).toEqual([]);
    expect(model.assumptions.join(" ")).toMatch(/Count unavailable/);
  });
  it("localizes headers, titles and cell wording in Hebrew", async () => {
    const model = (await buildExport("polls", q("he")))!;
    expect(model.headers).not.toContain("Pollster");
    expect(model.title).not.toBe("Polls");
  });
  it("still refuses an unknown kind", async () => {
    expect(await buildExport("nope", q())).toBeNull();
  });
});
