import { expect, it } from "vitest";
import { makeRecord } from "./records";
import { validatePrimaryNumbers } from "./primary-numbers";
import type { EmailLocale } from "./email";
const fact = makeRecord({
  recordId: "cbs:120010:2026-09",
  kind: "indicator_observation",
  electionId: null,
  effectiveAt: null,
  observedAt: "2026-10-27T00:47:36.758Z",
  status: "confirmed",
  evidenceClass: "primary_confirmed",
  previousRevisionId: null,
  payload: {
    name: "Consumer Price Index - General",
    period: "2026-09",
    seriesId: 120010,
    indexValue: 105.3,
    releaseDate: null,
    annualPercent: 1.6,
    monthlyPercent: -0.5,
    baseDescription: "Average 2024",
  },
  provenance: { sourceIds: [], captureIds: [] },
});
it("accepts actual CBS typed percentages and named/non-padded observation month", () => {
  for (const [locale, text] of [
    [
      "en",
      "September 2026: index 105.3; monthly -0.5%; annual 1.6%; base 2024.",
    ],
    ["he", "ספטמבר 2026: 105.3; -0.5%; 1.6%"],
    ["ar", "سبتمبر ٢٠٢٦: ١٠٥٫٣; -٠٫٥٪; ١٫٦٪"],
    ["fa", "سپتامبر ۲۰۲۶: ۱۰۵٫۳; -۰٫۵٪; ۱٫۶٪"],
    ["de", "September 2026: 105,3; -0,5 Prozent; 1,6 Prozent"],
    ["fr", "septembre 2026: 105,3; -0,5 pour cent; 1,6 pour cent"],
    ["zh", "2026年9月: 105.3; -0.5%; 1.6%"],
    ["en", "2026-9: index 105.3; fell by 0.5%; annual 1.6 percent"],
  ] as [EmailLocale, string][])
    expect(validatePrimaryNumbers(fact, text, locale), text).toEqual([]);
});
it("rejects invented dates, lost signs, unit changes and unrelated counts", () => {
  for (const text of [
    "September 2024",
    "October 2026",
    "2026-09-01",
    "monthly 0.5%",
    "rose by -0.5%",
    "index 105.3%",
    "monthly -0.5 percentage points",
    "105.3 people",
    "annual 1.6 seats",
    "monthly -0.6%",
    "9 households",
  ])
    expect(
      validatePrimaryNumbers(fact, text, "en").length,
      text,
    ).toBeGreaterThan(0);
});
it("never converts seats to percentages while retaining exact numeric checks", () => {
  const seats = makeRecord({
    ...fact,
    recordId: "seats",
    kind: "snapshot",
    payload: { snapshot: { pointSeats: { a: 61, b: 59 } } },
  });
  expect(validatePrimaryNumbers(seats, "61 seats", "en")).toEqual([]);
  expect(validatePrimaryNumbers(seats, "61 percent", "en")[0].code).toBe(
    "unsupported_unit",
  );
  expect(
    validatePrimaryNumbers(seats, "62 seats", "en").length,
  ).toBeGreaterThan(0);
});
it("accepts the actual French CBS series identifier only in explicit localized identifier context", () => {
  const french =
    "Pour septembre 2026, le CBS indique un indice de 105,3 (série 120010, base moyenne 2024), une variation mensuelle de -0,5 % et annuelle de 1,6 %.";
  expect(validatePrimaryNumbers(fact, french, "fr")).toEqual([]);
  for (const [locale, label] of [
    ["en", "series ID"],
    ["he", "סדרה"],
    ["ar", "السلسلة"],
    ["fa", "سری"],
    ["de", "Reihe"],
    ["fr", "série"],
    ["zh", "系列"],
  ] as [EmailLocale, string][]) {
    expect(validatePrimaryNumbers(fact, `${label} 120010`, locale)).toEqual([]);
    for (const invalid of [
      `${label} 120011`,
      `${label} 120010%`,
      `${label} 120010 seats`,
      `${label} 1.6%`,
      `120010`,
    ])
      expect(
        validatePrimaryNumbers(fact, invalid, locale).length,
        invalid,
      ).toBeGreaterThan(0);
  }
});
