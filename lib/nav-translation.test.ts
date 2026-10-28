import { describe, expect, it } from "vitest";
import { NAV_GROUPS, NAV_UTILITIES } from "./site";
import { ui } from "./i18n/ui";
import { referenceText } from "./i18n/reference";
import { type Lang } from "./i18n";
import "./i18n/ar/register";
import "./i18n/fa/register";
import "./i18n/de/register";
import "./i18n/fr/register";
import "./i18n/zh/register";

// Proper nouns and borrowed words that read the same in a language.
const SAME_OK: Partial<Record<Lang, string[]>> = {
  de: ["Forecast", "Coalition Builder", "Glossar", "Timeline"],
  fr: ["Coalition Builder", "Forecast", "Guides"],
  zh: ["Coalition Builder"],
  ar: ["Coalition Builder"],
  fa: ["Coalition Builder"],
};

describe.each(["ar", "fa", "de", "fr", "zh"] as const)("%s navigation", (lang) => {
  it("translates every menu label and blurb", () => {
    const items = [...NAV_GROUPS.flatMap((g) => g.items), ...NAV_UTILITIES];
    const strings = [...NAV_GROUPS.map((g) => g.label), ...items.flatMap((n) => [n.label, n.description, n.short ?? ""])].filter(Boolean);
    const left = [...new Set(strings)].filter((s) => ui(lang, s) === s && !(SAME_OK[lang] ?? []).includes(s));
    expect(left).toEqual([]);
  });
  it("translates the reference group labels", () => {
    const t = referenceText(lang);
    const en = referenceText("en");
    for (const id of ["elections", "parliament", "policies", "changes", "reference"] as const)
      expect(t[id]).not.toBe(en[id]);
  });
});
