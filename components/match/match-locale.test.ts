import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LANGS } from "@/lib/i18n";
import { matchText } from "@/lib/i18n/match";
import { campaignContext } from "@/lib/election-lifecycle/resolver";
import { rankParties, type Answers } from "@/lib/match";
import quiz from "@/data/quiz.json";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
const state = vi.hoisted(() => ({ path: "/match", blocked: false }));
vi.mock("@/components/seat-context/SeatContextProvider", () => ({
  useSeatContext: (initial?: SharedSeatContext) => ({
    context: state.blocked ? null : initial,
    blockedByEdition: state.blocked,
  }),
}));
vi.mock("next/navigation", () => ({ usePathname: () => state.path }));
vi.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: () => createElement("div", { "data-analytics": true }),
}));
import { buildMatchData } from "../pages/MatchPage";
import Results from "./Results";
import QuestionStep from "./QuestionStep";
import PrivacyAwareAnalytics from "../PrivacyAwareAnalytics";
import MatchQuiz from "./MatchQuiz";

describe("localized party match", () => {
  it("keeps question IDs, answer choices, scales and scores identical in all seven languages", () => {
    const context = campaignContext(),
      english = buildMatchData("en", context),
      ids = english.parties.map((p) => p.id),
      answers: Answers = Object.fromEntries(
        english.questions.map((q) => [
          q.key,
          { stance: q.offered[0], importance: 1 },
        ]),
      );
    const expected = rankParties(ids, english.questions, answers),
      raw = JSON.stringify(quiz);
    for (const lang of LANGS) {
      const data = buildMatchData(lang, context),
        copy = matchText(lang);
      expect(Object.keys(copy)).toEqual(Object.keys(matchText("en")));
      expect(
        Object.values(copy).every((s) => typeof s === "string" && s.length > 0),
      ).toBe(true);
      expect(
        data.questions.map((q) => ({
          key: q.key,
          offered: q.offered,
          scale: q.scale,
          cells: q.cells,
        })),
      ).toEqual(
        english.questions.map((q) => ({
          key: q.key,
          offered: q.offered,
          scale: q.scale,
          cells: q.cells,
        })),
      );
      expect(rankParties(ids, data.questions, answers)).toEqual(expected);
    }
    expect(JSON.stringify(quiz)).toBe(raw);
  });
  it("keeps unknown seats neutral and describes an absolute majority without claiming government support", () => {
    const context = {
      ...campaignContext(),
      seatStatus: "official" as const,
      evidenceStage: "official" as const,
      basis: "official_seats" as const,
      pointSeats: { likud: 100, mystery: 20 },
      parties: [
        { id: "likud", label: "Likud", profiled: true },
        { id: "mystery", label: "New list", profiled: false },
      ],
    };
    for (const lang of LANGS) {
      const data = buildMatchData(lang, context),
        answers: Answers = {};
      for (const q of data.questions) {
        const cell = q.cells.likud;
        if (cell?.kind === "stance" && q.offered.includes(cell.stance))
          answers[q.key] = { stance: cell.stance, importance: 1 };
      }
      const html = renderToStaticMarkup(
        createElement(Results, {
          data,
          answers,
          deeperDone: false,
          onEdit: () => {},
          onDeeper: () => {},
          onRestart: () => {},
        }),
      );
      expect(html).toContain(matchText(lang).other);
      expect(html).toContain(matchText(lang).majorityNote);
      expect(html).toContain("100");
      expect(html).toContain("120");
      expect(html.match(/fill="var\(--line-2\)"/g)).toHaveLength(20);
      expect(html.match(/<rect class="c"/g)).toHaveLength(120);
      expect(html).toContain("context=" + context.revision);
      expect(html).not.toContain("make a government");
      expect(html).not.toContain(
        "would pull a vote toward different governments",
      );
    }
  });
  it("does not reuse an earlier edition's allocation when the current edition is blocked", () => {
    state.blocked = true;
    const html = renderToStaticMarkup(
      createElement(MatchQuiz, {
        data: buildMatchData("he", campaignContext()),
      }),
    );
    expect(html).not.toContain("mq-options");
    expect(html).not.toContain('role="radio"');
    state.blocked = false;
  });
  it("marks source languages and has one keyboard tab stop in an unanswered radio group", () => {
    const data = buildMatchData("he", campaignContext()),
      q = data.questions[0];
    const html = renderToStaticMarkup(
      createElement(QuestionStep, {
        q,
        n: 1,
        of: 7,
        parties: data.parties,
        answer: null,
        onPick: () => {},
        onImportance: () => {},
        lang: "he",
      }),
    );
    expect(html).toContain('role="radiogroup"');
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
    expect(html).toContain(`lang="${q.textLang}" dir="auto"`);
  });
  it("never initializes analytics on answer-bearing or bearer-link routes", () => {
    for (const path of [
      "/match",
      ...LANGS.filter((l) => l !== "en").map((l) => `/${l}/match`),
      "/he/subscriptions/confirm",
    ]) {
      state.path = path;
      expect(
        renderToStaticMarkup(
          createElement(PrivacyAwareAnalytics, { gaId: "test" }),
        ),
      ).toBe("");
    }
    state.path = "/polls";
    expect(
      renderToStaticMarkup(
        createElement(PrivacyAwareAnalytics, { gaId: "test" }),
      ),
    ).toContain("data-analytics");
  });
});
