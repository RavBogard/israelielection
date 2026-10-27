import { describe, it, expect } from "vitest";
import { referenceBatchPlan, canStartReferenceEdition } from "./batch";
import {
  translationContentHash,
  type SourceDocument,
  type TranslationDocument,
} from "./translations";
const source = {
  id: "guides:one",
  path: "/guide/one",
  file: "source",
  revision: "version",
  title: "61 seats",
  checked: "2026-10-26",
  links: [],
  numbers: ["61"],
  blocks: [
    { id: "b", kind: "text", text: "61 seats", names: [], negated: false },
  ],
} satisfies SourceDocument;
function translated() {
  const t = {
    id: source.id,
    lang: "fr",
    sourceRevision: "version",
    status: "published",
    publishedAt: "2026-10-26T00:00:00Z",
    blocks: [{ id: "b", text: "61 sièges" }],
    review: {
      sourceRevision: "version",
      contentHash: "",
      model: "test",
      verdict: "supported",
      blocks: [
        {
          id: "b",
          supported: true,
          complete: true,
          negationPreserved: true,
          namesPreserved: true,
        },
      ],
    },
  } as TranslationDocument;
  t.review.contentHash = translationContentHash(t);
  return t;
}
describe("bounded reference batch plan", () => {
  it("skips only an exact current reviewed edition, not stale or withdrawn translations", () => {
    const options = {
      ids: [source.id],
      langs: ["fr", "he"],
      maxEditions: 1,
      maxMinutes: 10,
    };
    expect(
      referenceBatchPlan([source], [translated()], options).skipped,
    ).toEqual([{ id: source.id, lang: "fr" }]);
    expect(
      referenceBatchPlan(
        [source],
        [{ ...translated(), sourceRevision: "old" }],
        options,
      ).skipped,
    ).toHaveLength(0);
    expect(
      referenceBatchPlan(
        [source],
        [{ ...translated(), status: "withdrawn" }],
        options,
      ).skipped,
    ).toHaveLength(0);
  });
  it("enforces closed identities/locales and explicit caps", () => {
    for (const options of [
      { ids: ["../../private"], langs: ["he"], maxEditions: 2, maxMinutes: 10 },
      { ids: [source.id], langs: ["en"], maxEditions: 2, maxMinutes: 10 },
      { ids: [source.id], langs: ["he"], maxEditions: 0, maxMinutes: 10 },
      { ids: [source.id], langs: ["he"], maxEditions: 2, maxMinutes: 200 },
    ])
      expect(() => referenceBatchPlan([source], [], options)).toThrow();
  });
  it("defers beyond edition cap and leaves full per-edition budget before starting", () => {
    const plan = referenceBatchPlan([source], [], {
      ids: [source.id],
      langs: ["he", "fr", "de"],
      maxEditions: 2,
      maxMinutes: 10,
    });
    expect(plan.selected).toHaveLength(2);
    expect(plan.deferred).toHaveLength(1);
    expect(canStartReferenceEdition(600000, 50000)).toBe(true);
    expect(canStartReferenceEdition(600000, 50001)).toBe(false);
  });
});
