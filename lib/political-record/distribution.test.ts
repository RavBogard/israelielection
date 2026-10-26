import { expect, it } from "vitest";
import {
  followCatalog,
  validateFollows,
  validateChannels,
  selectedDistribution,
  matchesDistribution,
  publicationDistribution,
} from "./follows";
import { revalidatedJson } from "./http-cache";
it("validates explicit party/issue/place identifiers and caps private follows", () => {
  expect(
    validateFollows({
      parties: ["likud"],
      issues: ["economy"],
      places: ["3000"],
    }),
  ).toMatchObject({ parties: ["likud"] });
  for (const value of [
    { parties: ["not-a-party"], issues: [], places: [] },
    { parties: [], issues: [], places: ["<script>"] },
    { parties: ["likud", "likud"], issues: [], places: [] },
  ])
    expect(() => validateFollows(value)).toThrow("invalid_follows");
  expect(() =>
    validateChannels({
      dailyDigest: true,
      majorEvents: "yes",
      corrections: true,
    }),
  ).toThrow();
  expect(followCatalog("party", "Likud", "he")[0]).toMatchObject({
    id: "likud",
    kind: "party",
    sourceLocale: "en",
    labelLocale: "en",
  });
});
it("keeps legacy preferences distinct from explicit new channels", () => {
  expect(selectedDistribution(["digest"], null, null)).toMatchObject({
    preferenceVersion: 1,
    delivery: { dailyDigest: true, majorEvents: false, corrections: true },
  });
  expect(
    selectedDistribution(
      [],
      { parties: ["likud"], issues: [], places: [] },
      { dailyDigest: false, majorEvents: true, corrections: true },
    ).preferenceVersion,
  ).toBe(2);
});
it("separates daily digest, major events and corrections and matches explicit follows", () => {
  const selected = {
    topics: [],
    ...selectedDistribution(
      [],
      { parties: ["likud"], issues: [], places: [] },
      { dailyDigest: false, majorEvents: true, corrections: true },
    ),
  };
  expect(
    matchesDistribution(
      selected,
      publicationDistribution({
        delivery: "major_event",
        follows: { parties: ["likud"], issues: [], places: [] },
      }),
    ),
  ).toBe(true);
  expect(
    matchesDistribution(
      selected,
      publicationDistribution({
        delivery: "daily_digest",
        digestDate: "2026-11-04",
        follows: { parties: ["likud"], issues: [], places: [] },
      }),
    ),
  ).toBe(false);
  const correction = publicationDistribution({
    correctsRevisionId: "a".repeat(64),
    topics: ["policies"],
  });
  expect(matchesDistribution(selected, correction, true)).toBe(true);
  expect(
    matchesDistribution(
      { ...selected, delivery: { ...selected.delivery, corrections: false } },
      correction,
      true,
    ),
  ).toBe(false);
});
it("ETags revalidate changed visibility and never mask error responses", async () => {
  const request = new Request("https://example.org/api"),
    first = revalidatedJson(request, { claim: "visible" }),
    tag = first.headers.get("etag")!;
  const conditional = new Request(request, {
    headers: { "if-none-match": tag },
  });
  expect(revalidatedJson(conditional, { claim: "visible" }).status).toBe(304);
  const withdrawn = revalidatedJson(conditional, {
    claim: null,
    withheld: true,
  });
  expect(withdrawn.status).toBe(200);
  expect(withdrawn.headers.get("cache-control")).toBe(
    "public,max-age=0,must-revalidate",
  );
});
