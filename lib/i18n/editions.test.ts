import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import "./overlays";
import chrome from "./chrome";
import home from "./home";
import polls from "./polls";
import builder from "./builder";
import compare from "./compare";
import profile from "./profile";
import results from "./results";
import forecast from "./forecast";
import { overlays, partyText } from "./overlay-text";
import { localizeText, srcHash } from "./localize";
import { longDate } from "../format";
import partiesJson from "@/data/parties.json";
import { averagePoll, parties, blocs } from "../data";
import { homeRaceModel } from "../home-race";

const dictionaries = { chrome, home, polls, builder, compare, profile, results, forecast };
function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object" && "src" in value && "text" in value) return "translated field";
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  return typeof value;
}

describe.each(["ar", "fa"] as const)("%s edition", lang => {
  it("has every interface key and template signature", () => {
    for (const dictionary of Object.values(dictionaries)) expect(shape(dictionary[lang])).toEqual(shape(dictionary.en));
    expect(home[lang].hero.basis(7, "DATE")).toContain("7");
    expect(home[lang].hero.basis(7, "DATE")).toContain("DATE");
    expect(results[lang].watch.thresholdDt("3.25", 4)).toContain("3.25");
    expect(builder[lang].rowSame(4, "STANCE")).toContain("STANCE");
  });
  it("localizes names without overwriting another edition", () => {
    const likud = partiesJson.parties.find(p => p.id === "likud")!;
    expect(partyText(likud, "name", lang).lang).toBe(lang);
    expect(partyText(likud, "name", lang).text).toMatch(/[\u0600-\u06ff]/);
    expect(partyText(likud, "name", "he").lang).toBe("he");
    expect(partyText(likud, "name", "en").text).toBe(likud.name);
    expect(localizeText("Changed", { text: "قديم", src: srcHash("Before") }, lang)).toEqual({ text: "Changed", lang: "en" });
  });
  it("localizes the home chart's blocs and party drill-downs", () => {
    const model = homeRaceModel(averagePoll, parties, blocs, lang);
    for (const row of model.rows) {
      expect(row.labelLang).toBe(lang);
      expect(row.label).toMatch(/[\u0600-\u06ff]/);
      for (const party of row.members) expect(party.nameLang).toBe(lang);
    }
  });
  it("uses Gregorian election dates in both scripts", () => {
    const date = longDate("2026-10-27", lang);
    expect(date).toContain("2026");
    expect(date).toContain("27");
    expect(date).toMatch(/[\u0600-\u06ff]/);
  });
  it("keeps source metadata and has no placeholder remnants", () => {
    const data = overlays(lang);
    // New or changed English data may legitimately fall back; translations carry a hash for that check.
    expect(data.parties.likud.name.src).toMatch(/^[0-9a-f]{8}$/);
    expect(data.questions).not.toEqual({});
    expect(data.positions).not.toEqual({});
    const directory = join(process.cwd(), "data", lang);
    const files = readdirSync(directory, { recursive: true }).filter(file => String(file).endsWith(".json"));
    for (const file of files) {
      const text = readFileSync(join(directory, String(file)), "utf8");
      expect(text, String(file)).not.toMatch(/ZXPH|ZXKEEP|ZXMSG|<x\d+>|%%KEEP/);
    }
  });
});
