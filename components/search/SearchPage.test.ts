import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { SearchEntry } from "@/lib/search";
import glossary from "@/data/glossary.json";

const seen: { entries: SearchEntry[] }[] = [];
vi.mock("@/lib/seat-context-server", () => ({
  seatContextForRender: async () => null,
}));
vi.mock("@/lib/reference/read-model", () => ({
  referenceReadModel: async () => ({ lifecycle: null, elections: [] }),
}));
vi.mock("@/components/seat-context/SeatBasis", () => ({ default: () => null }));
vi.mock("@/components/SiteSearch", () => ({
  default: (props: { entries: SearchEntry[] }) => {
    seen.push(props);
    return null;
  },
}));
import SearchPage from "./SearchPage";

async function glossaryEntries(lang: "en" | "he" | "ar" | "fa" | "de" | "fr" | "zh") {
  seen.length = 0;
  renderToStaticMarkup(await SearchPage({ lang }));
  return seen[0].entries.filter((e) => e.kind === "glossary");
}
describe("search glossary terms follow the edition", () => {
  it("lists the English terms in the English edition", async () => {
    const entries = await glossaryEntries("en");
    expect(entries.map((e) => e.title)).toEqual(glossary.terms.map((t) => t.term));
    expect(entries.every((e) => !e.translationPending)).toBe(true);
  });
  it("uses the published translated terms, keeping the English term searchable", async () => {
    for (const lang of ["he", "ar", "fa", "zh", "de", "fr"] as const) {
      const entries = await glossaryEntries(lang);
      expect(entries).toHaveLength(glossary.terms.length);
      const ready = entries.filter((e) => !e.translationPending);
      expect(ready.length).toBe(entries.length);
      expect(entries[0].title).not.toBe(glossary.terms[0].term);
      expect(entries[0].aliases).toContain(glossary.terms[0].term);
      expect(entries[0].href).toContain("#" + "alternate-prime-minister");
    }
  });
});
