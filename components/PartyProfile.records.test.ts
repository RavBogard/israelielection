import "@/lib/i18n/ar/register";
import "@/lib/i18n/fa/register";
import "@/lib/i18n/de/register";
import "@/lib/i18n/fr/register";
import "@/lib/i18n/zh/register";
import "@/lib/i18n/overlays";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parties } from "@/lib/data";
import { LANGS } from "@/lib/i18n";
import { POST_RECORDS } from "@/lib/i18n/post-records";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import PartyProfile from "./PartyProfile";
import PollsterAccuracy from "./polls/PollsterAccuracy";

const SEATS: Record<string, number> = { likud: 28, otzma: 7, shas: 9, utj: 7, rz: 2, yashar: 16, byachad: 13, dem: 10, yb: 10, jl: 9, raam: 9 };
/** A coherent 120-seat allocation: changes to one list are balanced by the largest opposition list. */
const balanced = (over: Record<string, number>) => { const m = { ...SEATS, ...over }; m.yashar += 120 - Object.values(m).reduce((a, b) => a + b, 0); return m; };
const ctx = (over: Partial<SharedSeatContext> = {}) =>
  ({
    basis: "partial_count",
    seatStatus: "estimated",
    pointSeats: SEATS,
    observedAt: "2026-10-28T10:00:00Z",
    publishedAt: null,
    snapshotRevision: "r1",
    revision: "rev1",
    freshness: { status: "current", checkedAt: null, lastAttemptAt: null },
    correctionOf: null,
    reasonCodes: [],
    parties: [],
    sourceRefs: [],
    uncertainty: { partyIntervals: { likud: { lo: 26, median: 27, hi: 28 } } },
    ...over,
  }) as unknown as SharedSeatContext;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;");
const render = (id: string, lang: (typeof LANGS)[number], context: SharedSeatContext | null) =>
  renderToStaticMarkup(createElement(PartyProfile, { party: parties.find((p) => p.id === id)!, lang, context }));

describe("profile: result against the polls", () => {
  it("shows the count with its range, the final polls, 2022 and the last Knesset, in every edition", () => {
    for (const lang of LANGS) {
      const html = render("likud", lang, ctx());
      expect(html, lang).toContain('data-testid="profile-result"');
      expect(html, lang).toContain(POST_RECORDS[lang].resultTitle);
      expect(html, lang).toContain(POST_RECORDS[lang].countSoFar);
      expect(html, lang).toContain(POST_RECORDS[lang].lastKnesset);
      expect(html, lang).toContain(esc(POST_RECORDS[lang].provisionalNote));
      expect(html, lang).toContain("26");  // the 80% range's low end
    }
  });
  it("swaps to the official wording by itself and drops the range", () => {
    const html = render("likud", "en", ctx({ seatStatus: "official", basis: "official_seats" }));
    expect(html).toContain(POST_RECORDS.en.officialResult);
    expect(html).toContain(POST_RECORDS.en.officialNote);
    expect(html).not.toContain(POST_RECORDS.en.provisionalNote);
    expect(html).not.toContain("80% range");
  });
  it("folds the campaign record, collapsed", () => {
    const html = render("likud", "en", ctx());
    expect(html).toMatch(/<details class="pp-fold o3">/);
    expect(html).toContain(POST_RECORDS.en.campaignRecord);
  });
  it("shows no result strip without a count context", () => {
    expect(render("likud", "en", null)).not.toContain('data-testid="profile-result"');
  });
});

describe("profile: listed names and surplus", () => {
  it("marks a numbered name on track only inside the projected seats", () => {
    const html = render("likud", "en", ctx());
    expect(html).toContain(POST_RECORDS.en.onTrack);
    expect(html).toContain(POST_RECORDS.en.marksNote);
    const tight = render("likud", "en", ctx({ pointSeats: balanced({ likud: 3 }) }));
    expect((tight.match(/data-testid="candidate-mark"/g) ?? []).length).toBeLessThan((html.match(/data-testid="candidate-mark"/g) ?? []).length);
  });
  it("never marks the names of a list with no seats before the result is official", () => {
    const html = render("poi", "en", ctx());
    expect(html).not.toContain('data-testid="candidate-mark"');
  });
  it("says Elected or Not elected once official", () => {
    const html = render("likud", "en", ctx({ seatStatus: "official", pointSeats: balanced({ likud: 5 }) }));
    expect(html).toContain(POST_RECORDS.en.notElected);
    expect(html).not.toContain(POST_RECORDS.en.onTrack);
  });
  it("retitles the pledges and states the surplus pair's standing", () => {
    expect(render("likud", "en", ctx())).toContain("Pledges to be tested in coalition talks");
    expect(render("jl", "en", ctx())).toContain('data-testid="surplus-status"');
    expect(render("jl", "en", ctx({ pointSeats: balanced({ raam: 0 }) }))).toContain("one is below the threshold");
  });
});

describe("polls: pollster accuracy table", () => {
  const rows = [
    { pollster: "Alpha", published: "2026-10-23", lists: 10, mae: 1.2, bloc: { net: 2, opp: 3 }, apart: false },
    { pollster: "Channel 14", published: "2026-10-24", lists: 10, mae: 3, bloc: { net: 5, opp: 6 }, apart: true },
  ];
  it("is labelled provisional until the count is official, in every edition", () => {
    for (const lang of LANGS) {
      const html = renderToStaticMarkup(createElement(PollsterAccuracy, { rows, labels: { net: "N", opp: "O" }, official: false, lang }));
      expect(html, lang).toContain(POST_RECORDS[lang].accTitle);
      expect(html, lang).toContain('data-provisional="true"');
      expect(html, lang).toContain('data-apart="true"');
    }
    const official = renderToStaticMarkup(createElement(PollsterAccuracy, { rows, labels: { net: "N", opp: "O" }, official: true, lang: "en" }));
    expect(official).toContain('data-provisional="false"');
    expect(official).not.toContain("(provisional)");
  });
});
