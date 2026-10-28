import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import { ELECTIONS } from "@/lib/political-record/elections";
import { ARCHIVE_EDITION_IDS } from "@/lib/archive-editions";
import { LANGS, editionPath } from "@/lib/i18n";

describe("sitemap editions", () => {
  it("lists every edition id in every language", () => {
    const urls = new Set(sitemap().map((e) => e.url));
    for (const id of [...ELECTIONS.map((e) => e.id), ...ARCHIVE_EDITION_IDS])
      for (const lang of LANGS) {
        const path = editionPath(`/elections/${id}`, lang);
        expect(urls.has(`https://www.israelielection.org${path}`), `${lang} ${id}`).toBe(true);
      }
  });
});
