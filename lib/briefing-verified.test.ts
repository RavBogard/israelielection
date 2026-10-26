import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  validateAtomicClaims,
  qualifyAtomicDraft,
  qualifyReviewedClaims,
  independentReporting,
  publicClaimEvidence,
  validateClaimReview,
  translatedSentence,
  type AtomicClaim,
  type CapturedArticle,
} from "./briefing-verified";
import { allowedNewsUrl, reportingOrigin } from "./briefing-acquisition";
const article = {
  body: "The committee said the proposal would not grant 61 seats. It has not adopted the proposal and no final decision was announced.",
} as CapturedArticle;
const claims = () =>
  [1, 2, 3].map((id) => ({
    id: String(id),
    text: "The committee said the proposal would not grant 61 seats.",
    kind: "attributed_perspective",
    citations: [{ source: 1, quote: article.body }],
  })) as AtomicClaim[];
describe("atomic article-grounded briefing", () => {
  it("rejects title-only overlap and fabricated quotation", () => {
    const draft = claims();
    draft[0].citations[0].quote = "The committee adopted the proposal.";
    expect(() => validateAtomicClaims(draft, [article])).toThrow(
      "quote_not_in_captured_article",
    );
  });
  it("rejects an unsupported number despite matching actors and topic", () => {
    const draft = claims();
    draft[0].text = "The committee granted 99 seats.";
    expect(() => validateAtomicClaims(draft, [article])).toThrow(
      "unsupported_claim_number",
    );
  });
  it("requires separate semantic support, atomicity, attribution and no inference", () => {
    expect(validateAtomicClaims(claims(), [article])).toHaveLength(3);
    const review = claims().map((c) => ({
      id: c.id,
      supported: true,
      atomic: true,
      attributionPreserved: true,
      noAddedInference: true,
    }));
    review[0].supported = false;
    expect(() => validateClaimReview(claims(), review)).toThrow(
      "atomic_semantic_review_rejected",
    );
  });
  it("does not reuse translations after a source correction", () => {
    expect(
      translatedSentence(
        "Source",
        "he",
        { text: "תרגום", sourceHash: "old", model: "test", reviewed: true },
        "new",
      ),
    ).toBeNull();
  });
  it("bounds source acquisition to the registered HTTPS article hosts", () => {
    expect(allowedNewsUrl("https://www.jpost.com/article/123")).toBe(true);
    expect(allowedNewsUrl("https://www.jpost.com.evil.test/article")).toBe(
      false,
    );
    expect(allowedNewsUrl("http://www.jpost.com/article")).toBe(false);
    expect(allowedNewsUrl("https://user:pass@www.jpost.com/article")).toBe(
      false,
    );
  });
});

it("makes preview and explicit dry runs incapable of publishing or notifying", () => {
  const workflow = readFileSync(".github/workflows/briefing.yml", "utf8");
  expect(workflow).toContain(
    "(inputs.dry_run || github.ref != 'refs/heads/main') && '--dry-run'",
  );
  expect(
    workflow.match(
      /if: github.ref == 'refs\/heads\/main' && !inputs.dry_run && steps.job.outputs.published == '1'/g,
    ),
  ).toHaveLength(2);
  expect(
    workflow.match(
      /if: always\(\) && github.ref == 'refs\/heads\/main' && !inputs.dry_run/g,
    ),
  ).toHaveLength(2);
});

it("requires qualified independent reporting for factual changes, not two copies or domains alone", () => {
  const make = (id: string, wire = false): CapturedArticle => ({
    ...article,
    url: "https://" + id + ".example/news",
    body:
      article.body +
      " " +
      Array.from({ length: 100 }, (_, i) => id + i).join(" "),
    bodyHash: id,
    capturedAt: "2026-10-26T00:00:00Z",
    origin: {
      id: wire ? "wire:reuters" : "newsroom:" + id,
      kind: wire ? "wire" : "newsroom",
      byline: id,
    },
  });
  const a = make("one"),
    b = make("two");
  const factual = claims().map((c) => ({
    ...c,
    kind: "change" as const,
    citations: [
      { source: 1, quote: article.body },
      { source: 2, quote: article.body },
    ],
  }));
  expect(validateAtomicClaims(factual, [a, b])).toHaveLength(3);
  expect(
    independentReporting(
      { ...a, origin: { id: null, kind: "unknown", byline: null } },
      b,
    ),
  ).toBe(false);
  expect(independentReporting(make("one", true), make("two", true))).toBe(
    false,
  );
  expect(
    independentReporting(a, { ...b, body: a.body, bodyHash: a.bodyHash }),
  ).toBe(false);
  expect(() =>
    validateAtomicClaims(factual, [a, { ...b, origin: a.origin }]),
  ).toThrow("independent_reporting_required");
  expect(() =>
    validateAtomicClaims(
      factual.map((c) => ({ ...c, citations: [c.citations[0]] })),
      [a],
    ),
  ).toThrow("independent_reporting_required");
  const receipt = publicClaimEvidence(factual[0], [a, b]);
  expect(JSON.stringify(receipt)).not.toContain(article.body);
  expect(receipt[0].quoteHash).toMatch(/^[a-f0-9]{64}$/);
});

it("records explicit byline origins and treats unknown/same wire as unqualified", () => {
  const html = (name: string) =>
    `<script type="application/ld+json">${JSON.stringify({ "@type": "NewsArticle", author: { name } })}</script>`;
  expect(
    reportingOrigin(html("Reuters"), "https://www.jpost.com/story").id,
  ).toBe("wire:reuters");
  expect(
    reportingOrigin(html("Named Reporter"), "https://www.jpost.com/story").kind,
  ).toBe("newsroom");
  expect(
    reportingOrigin(
      "<article>No byline</article>",
      "https://www.jpost.com/story",
    ).kind,
  ).toBe("unknown");
});

it("discards only unsupported numeric claims while retaining independently reviewable claims", () => {
  const good = claims(),
    bad = { ...good[0], id: "bad", text: "The committee granted99 seats." };
  const result = qualifyAtomicDraft([...good, bad], [article]);
  expect(result.claims).toHaveLength(3);
  expect(result.discarded[0].diagnostic).toMatchObject({
    claimId: "bad",
    token: "99",
  });
  expect(JSON.stringify(result.discarded)).not.toContain(article.body);
  expect(
    qualifyAtomicDraft([good[0], good[1], bad], [article]).claims,
  ).toHaveLength(2);
  expect(() =>
    qualifyAtomicDraft(
      [
        ...good,
        {
          ...bad,
          citations: [
            {
              source: 1,
              quote: "A fabricated quotation is not source evidence.",
            },
          ],
        },
      ],
      [article],
    ),
  ).toThrow("quote_not_in_captured_article");
});

it("retains one fully reviewed claim and omits failed reviews without retrying their verdict", () => {
  const draft = claims(),
    review = draft.map((c) => ({
      id: c.id,
      supported: true,
      atomic: true,
      attributionPreserved: true,
      noAddedInference: true,
    }));
  review[0].supported = false;
  review[1].atomic = false;
  const result = qualifyReviewedClaims(draft, review);
  expect(result.claims.map((c) => c.id)).toEqual(["3"]);
  expect(result.discarded).toHaveLength(2);
  review[2].noAddedInference = false;
  expect(() => qualifyReviewedClaims(draft, review)).toThrow(
    "no_independently_verified_claims",
  );
  expect(() => qualifyReviewedClaims(draft, review.slice(0, 1))).toThrow(
    "atomic_review_shape_invalid",
  );
});
