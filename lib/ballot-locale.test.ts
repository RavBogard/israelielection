import { describe, it, expect } from "vitest";
import { ballotLabels } from "./ballot-locale";
import { ballotLists, filterBallot } from "./ballot";
import { parties } from "./data";
import { LANGS } from "./i18n";
import { partyDirectoryText } from "./i18n/party-directory";
describe("localized party and ballot labels", () => {
  it("keeps every original record and uses reviewed profile labels or official original Hebrew", () => {
    for (const lang of LANGS) {
      const labels = ballotLabels(lang);
      expect(Object.keys(labels)).toHaveLength(38);
      for (const list of ballotLists) {
        expect(labels[list.id].name.text).toBeTruthy();
        if (!list.profile && lang !== "en")
          expect(labels[list.id].name).toEqual({
            text: list.hebrew,
            lang: "he",
          });
      }
      for (const value of Object.values(partyDirectoryText(lang)))
        expect(value).toBeTruthy();
    }
  });
  it("searches reviewed aliases across scripts and ignores vocalization marks without losing roster identity", () => {
    const aliases = Object.fromEntries(
      Object.entries(ballotLabels("ar")).map(([id, row]) => [id, row.aliases]),
    );
    expect(
      filterBallot(ballotLists, "הַלִּיכּוּד", "all", aliases).some(
        (l) => l.profile === "likud",
      ),
    ).toBe(true);
    const arabic = ballotLabels("ar").likud.name.text;
    expect(
      filterBallot(ballotLists, arabic, "all", aliases).some(
        (l) => l.profile === "likud",
      ),
    ).toBe(true);
    expect(
      filterBallot(ballotLists, "ק", "other", aliases).some(
        (l) => l.id === "tekuma",
      ),
    ).toBe(true);
  });
  it("does not reuse a stale name translation after the English source changes", () => {
    const changed = parties.map((p) =>
      p.id === "likud" ? { ...p, name: "Changed source name" } : p,
    );
    const label = ballotLabels("he", changed).likud.name;
    expect(label.lang).toBe("en");
    expect(label.text).toBe("Changed source name");
  });
});
