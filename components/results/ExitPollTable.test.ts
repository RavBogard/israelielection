import "@/lib/i18n/ar/register";
import "@/lib/i18n/fa/register";
import "@/lib/i18n/de/register";
import "@/lib/i18n/fr/register";
import "@/lib/i18n/zh/register";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { allPolls, pollsData } from "@/lib/data";
import { LANGS } from "@/lib/i18n";
import { splitExits } from "@/lib/exit-split";
import { resultsConfig } from "@/lib/results-live";
import type { Poll } from "@/lib/types";
import ExitPollTable from "./ExitPollTable";

/** Channel 14's exit poll as aired, not yet in data/polls.json: a fixture for the set-apart block. */
const seats = { likud: 30, yashar: 19, byachad: 11, jl: 10, shas: 9, dem: 9, otzma: 7, raam: 7, rz: 7, utj: 7, yb: 4 };
const channel14: Poll = {
  id: "channel-14-exit-fixture",
  pollster: "Channel 14",
  firm: null,
  fieldwork: "Oct 27, 2026",
  published: "2026-10-27",
  via: "fixture",
  url: null,
  n: null,
  margin: null,
  note: "",
  results: Object.fromEntries(Object.entries(seats).map(([id, s]) => [id, { seats: s }])),
  combined: [],
  kind: "exit",
  broadcastAt: "2026-10-27T22:00:00+02:00",
} as unknown as Poll;
const withC14 = [...allPolls, channel14];

const html = (polls: Poll[], lang: (typeof LANGS)[number] = "en") =>
  renderToStaticMarkup(createElement(ExitPollTable, { polls, pollsConfig: pollsData.config, config: resultsConfig, lang }));
const columns = (markup: string, testId: string) => {
  const table = markup.split(`data-testid="${testId}"`)[1]?.split("</table>")[0] ?? "";
  return [...table.matchAll(/data-pollster="([^"]+)"/g)].map((m) => m[1]);
};

describe("splitExits", () => {
  it("keeps each broadcaster's latest version and sets withoutVariant pollsters apart", () => {
    const { main, apart, updated } = splitExits(withC14, pollsData.config);
    expect(main.map((p) => p.pollster)).not.toContain("Channel 14");
    expect(apart.map((p) => p.id)).toEqual(["channel-14-exit-fixture"]);
    expect(new Set(main.map((p) => p.pollster)).size).toBe(main.length);
    const c12 = allPolls.filter((p) => p.kind === "exit" && p.pollster === "Channel 12");
    if (c12.length > 1) {
      expect(updated.has("Channel 12")).toBe(true);
      const newest = c12.reduce((a, b) => (Date.parse(b.broadcastAt!) > Date.parse(a.broadcastAt!) ? b : a));
      expect(main.find((p) => p.pollster === "Channel 12")!.id).toBe(newest.id);
    }
  });
});

describe("ExitPollTable", () => {
  it("never puts Channel 14 in the main table; shows it in its own block", () => {
    const markup = html(withC14);
    expect(columns(markup, "exit-main")).not.toContain("Channel 14");
    expect(columns(markup, "exit-apart-table")).toEqual(["Channel 14"]);
    expect(markup).toContain('data-testid="exit-caution"');
  });

  it("has no set-apart block when only the forecast's channels have aired", () => {
    const markup = html(allPolls);
    expect(markup).not.toContain('data-testid="exit-apart"');
    expect(columns(markup, "exit-main").length).toBe(splitExits(allPolls, pollsData.config).main.length);
  });

  it("marks below-threshold lists and adds a bloc totals block", () => {
    const markup = html(allPolls);
    expect(markup).toContain('data-below="true"');
    expect(markup).toContain('data-testid="exit-main-blocs"');
  });

  it("renders Israel time only on the server (the reader's time is added in the browser)", () => {
    const markup = html(allPolls);
    expect(markup).toContain('data-testid="exit-air-time"');
    expect(markup).not.toContain("xt-local");
  });

  it("renders in all seven editions", () => {
    for (const lang of LANGS) expect(html(withC14, lang)).toContain('data-testid="exit-apart-table"');
  });

  it("renders nothing before any exit poll", () => {
    expect(html(allPolls.filter((p) => p.kind !== "exit"))).toBe("");
  });
});
