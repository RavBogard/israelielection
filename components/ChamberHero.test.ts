import "@/lib/i18n/ar/register";
import "@/lib/i18n/fa/register";
import "@/lib/i18n/de/register";
import "@/lib/i18n/fr/register";
import "@/lib/i18n/zh/register";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LANGS, locale } from "@/lib/i18n";
import { CHAMBER } from "@/lib/i18n/chamber";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { chamberLayout, seatParties } from "@/lib/chamber";
import ChamberHero from "./ChamberHero";

const seats = { likud: 27, otzma: 7, utj: 7, shas: 6, rz: 6, yashar: 22, byachad: 12, dem: 8, yb: 7, jl: 11, raam: 7 };
const context = (over: Partial<SharedSeatContext> = {}): SharedSeatContext => ({
  schemaVersion: 1, election: "2026-10-27", revision: "a".repeat(64), snapshotRevision: "b".repeat(64), sequence: 3,
  updatedAt: "2026-10-28T12:00:00Z", evidenceStage: "count" as SharedSeatContext["evidenceStage"], basis: "partial_count", seatStatus: "estimated",
  pointMethod: "representative_joint_draw" as SharedSeatContext["pointMethod"], pointSeats: seats,
  parties: Object.keys(seats).map((id) => ({ id, label: id, profiled: true })),
  sourceRefs: [], publishedAt: null, observedAt: "2026-10-28T12:00:00Z", correctionOf: null,
  freshness: { status: "current", checkedAt: null, lastAttemptAt: null }, reasonCodes: [], ...over,
});
const progress = { counted: 0.858, envelopesPending: 622_624, blocIntervals: { net: { lo: 52, hi: 53 }, opp: { lo: 49, hi: 50 }, arab: { lo: 18, hi: 18 } } };
const render = (lang: (typeof LANGS)[number], ctx = context()) => renderToStaticMarkup(createElement(ChamberHero, { initial: ctx, lang, progress }));

describe("chamber layout", () => {
  it("places 120 seats and seats the Netanyahu bloc on the right of the hall", () => {
    const layout = chamberLayout(120);
    expect(layout).toHaveLength(120);
    const placed = seatParties(layout, Object.entries(seats).map(([id, n]) => ({ id, seats: n, bloc: ["likud", "otzma", "utj", "shas", "rz"].includes(id) ? "net" : ["jl", "raam"].includes(id) ? "arab" : "opp" })));
    expect(placed).toHaveLength(120);
    const meanX = (bloc: string) => { const s = placed.filter((p) => p.bloc === bloc); return s.reduce((a, p) => a + p.x, 0) / s.length; };
    expect(meanX("net")).toBeGreaterThan(meanX("opp"));
    expect(meanX("opp")).toBeGreaterThan(meanX("arab"));
    expect(placed.filter((p) => p.bloc === "net")).toHaveLength(53);
  });
});

describe.each(LANGS)("%s chamber hero", (lang) => {
  it("asks the majority question, draws every seat and gives each bloc's distance from 61", () => {
    const html = render(lang).replace(/&#x27;/g, "'");
    expect(html).toContain('data-testid="chamber-hero"');
    expect(html).toContain(CHAMBER[lang].noMajority((61).toLocaleString(locale(lang))));
    expect(html.match(/<circle/g) ?? []).toHaveLength(120);
    expect(html).toContain('data-bloc="net"');
    expect(html).toContain('data-bloc="opp"');
  });
});

describe("chamber hero when official", () => {
  it("drops ranges and envelope copy and names the official result", () => {
    const html = render("en", context({ seatStatus: "official", basis: "official_seats" }));
    expect(html).toContain(CHAMBER.en.official);
    expect(html).not.toContain("envelope");
    expect(html).not.toContain("range ");
  });
  it("names a bloc that reaches 61", () => {
    const html = render("en", context({ pointSeats: { ...seats, likud: 35 } }));
    expect(html).not.toContain(CHAMBER.en.noMajority("61"));
  });
});
