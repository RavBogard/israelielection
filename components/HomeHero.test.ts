import "@/lib/i18n/ar/register";
import "@/lib/i18n/fa/register";
import "@/lib/i18n/de/register";
import "@/lib/i18n/fr/register";
import "@/lib/i18n/zh/register";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LangProvider } from "@/lib/i18n/lang";
import { LANGS } from "@/lib/i18n";
import { DASHBOARD } from "@/lib/i18n/election-dashboard";
import { averagePoll, parties, blocs } from "@/lib/data";
import { homeRaceModel } from "@/lib/home-race";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { cadenceMetadata } from "@/lib/election-lifecycle/cadence";
import { claimsExpired } from "./government/GovernmentLive";
import HomeHero from "./HomeHero";
const context: SharedSeatContext = {
  schemaVersion: 1,
  election: "2026-10-27",
  revision: "a".repeat(64),
  snapshotRevision: "b".repeat(64),
  sequence: 3,
  updatedAt: "2026-10-29T12:00:00Z",
  evidenceStage: "official",
  basis: "official_seats",
  seatStatus: "official",
  pointMethod: "published_official_allocation",
  pointSeats: { likud: 50, yashar: 50, new: 20 },
  parties: [
    { id: "likud", label:"Likud", profiled: true },
    { id: "yashar", label:"Yashar", profiled: true },
    { id: "new", label: "New list", profiled: false },
  ],
  sourceRefs: [],
  publishedAt: "2026-10-29",
  observedAt: "2026-10-29T12:00:00Z",
  correctionOf: null,
  freshness: { status: "complete", checkedAt: null, lastAttemptAt: null },
  reasonCodes: [],
};
describe.each(LANGS)("%s restored hero", (lang) => {
  it("leads with phase copy, an interactive complete parliament and explicit comparisons", () => {
    const model = homeRaceModel(averagePoll, parties, blocs, lang),
      options = [
        { id: "current", label: DASHBOARD[lang].current, model },
        { id: "forecast", label: "Saved forecast", model },
        { id: "avg", label: "Average", model },
        { id: "latest", label: "Latest", model },
      ];
    const html = renderToStaticMarkup(
      createElement(
        LangProvider,
        { lang },
        createElement(HomeHero, { initial: context, options, days: 0, lang }),
      ),
    );
    expect(html).toContain(DASHBOARD[lang].officialHero);
    expect(html).toContain('aria-pressed="true"');
    expect(html.match(/data-cell=/g) ?? []).toHaveLength(120);
    expect(html.match(/data-bloc="other"/g) ?? []).toHaveLength(20);
    expect(html).toContain('class="mosaic-bloc-control"');
    expect(html).not.toContain("Current seat context");
    expect(html).not.toContain("/parties/new");
  });
});
it("expires negotiation claims at the missed cadence plus grace, not after15minutes during3hourcadence", () => {
  const cadence = cadenceMetadata(
    "2026-10-28T06:30:00Z",
    "2026-10-28T06:00:00Z",
    "2026-10-28T06:00:00Z",
  );
  expect(claimsExpired({ cadence }, Date.parse("2026-10-28T08:59:00Z"))).toBe(
    false,
  );
  expect(claimsExpired({ cadence }, Date.parse("2026-10-28T09:06:00Z"))).toBe(
    true,
  );
  expect(
    claimsExpired(
      { cadence: { ...cadence, phase: "before_close" } },
      Date.parse("2026-10-28T09:06:00Z"),
    ),
  ).toBe(false);
});
