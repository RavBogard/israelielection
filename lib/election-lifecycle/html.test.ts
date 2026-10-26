import { expect, it } from "vitest";
import fixture from "./fixtures/party-primary-dom.json";
import { articleOf, indexArticlesOf } from "./html";
import { validateEvent } from "./events";

it("reads exact real nested Elementor single-post content and article metadata rather than a teaser", () => {
  const article = articleOf(
    '<article class="elementor-post"><h2>Teaser</h2></article>' +
      fixture.yb.html,
  );
  expect(article.body.length).toBeGreaterThan(1200);
  expect(article.body).toContain("התוכנית של אביגדור ליברמן");
  expect(article.publishedAt).toBe("2026-06-15T21:20:47+00:00");
  expect(article.title).toContain("ליברמן");
});
it("keeps primary-owned dated excerpts separate and resolves immutable post fragments without webpage dates", () => {
  const records = indexArticlesOf(fixture.democrats.html);
  expect(records).toHaveLength(3);
  expect(records[0].publishedAt).toBe("2026-10-18");
  expect(records[1].publishedAt).toBe("2026-10-17");
  const selected = articleOf(
    fixture.democrats.html,
    fixture.democrats.source + "#" + records[2].key,
  );
  expect(selected.body).toBe(records[2].body);
  expect(selected.body).not.toContain(records[0].body);
  expect(
    articleOf(
      fixture.democrats.html,
      fixture.democrats.source + "#lifecycle-post-absent",
    ).body,
  ).toBe("");
  // Acquiring an older genuine source never turns it into a current negotiation claim.
  expect(
    validateEvent(
      {
        type: "party_position",
        effectiveAt: records[0].publishedAt!,
        partyIds: ["dem"],
        person: null,
        decision: "support",
        durationDays: null,
        evidenceQuote: records[0].body,
        supersedes: null,
      },
      {
        id: "party-dem",
        publisher: "Democrats",
        authority: "party",
        title: "",
        url: fixture.democrats.source,
        publishedAt: records[0].publishedAt,
        observedAt: "2026-11-05T00:00Z",
        captureHash: "a".repeat(64),
        partyIds: ["dem"],
      },
      records[0].body,
      "2026-11-05T00:00Z",
    ),
  ).toBeNull();
});
