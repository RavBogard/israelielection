import { describe, expect, it } from "vitest";
import { ARCHIVE_EDITION_IDS, archiveEdition, canonicalEditionId } from "./archive-editions";

describe("archive editions", () => {
  it("covers Knesset 21 to 25 from the shipped committee files", () => {
    expect(ARCHIVE_EDITION_IDS).toEqual(["il-knesset-21", "il-knesset-22", "il-knesset-23", "il-knesset-24", "il-knesset-25"]);
    for (const id of ARCHIVE_EDITION_IDS) {
      const e = archiveEdition(id)!;
      expect(e.lists.reduce((n, l) => n + l.seats, 0)).toBe(120);
      expect(e.source.results).toMatch(/^https:\/\/votes\d+\.bechirot\.gov\.il/);
      expect(e.turnoutPct).toBeGreaterThan(60);
      expect(e.government?.source.url).toMatch(/^https:/);
    }
  });
  it("resolves every public alias", () => {
    expect(canonicalEditionId("2022")).toBe("il-knesset-25");
    expect(canonicalEditionId("2019a")).toBe("il-knesset-21");
    expect(canonicalEditionId("21")).toBe("il-knesset-21");
    expect(canonicalEditionId("2026")).toBe("il-knesset-26");
    expect(canonicalEditionId("26")).toBe("il-knesset-26");
    expect(canonicalEditionId("constructor")).toBeNull();
    expect(archiveEdition("il-knesset-26")).toBeNull();
  });
});
