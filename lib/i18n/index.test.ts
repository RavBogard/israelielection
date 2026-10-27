import { describe, expect, it } from "vitest";
import { editionPath, pathLang, enPath, hasHebrew, hePath, isHePath, otherEdition, LANGS, isRtl } from "./index";

describe("edition paths", () => {
  it("keeps Latin and Chinese editions left to right", () => {
    for (const lang of LANGS) expect(isRtl(lang)).toBe(["he", "ar", "fa"].includes(lang));
  });
  it("switches directly between every edition and preserves tool state", () => {
    for (const from of LANGS) {
      const source = editionPath("/coalition-builder?with=likud,shas&poll=results#seats", from)!;
      for (const to of LANGS) {
        expect(editionPath(source, to)).toBe(`${to === "en" ? "" : `/${to}`}/coalition-builder?with=likud,shas&poll=results#seats`);
      }
    }
    expect(editionPath("/ar", "fa")).toBe("/fa");
    expect(editionPath("/fa/parties/likud/", "ar")).toBe("/ar/parties/likud");
    expect(editionPath("/about", "fa")).toBe("/fa/about");
    expect(pathLang("/ar?x=1")).toBe("ar");
    expect(pathLang("/faraway")).toBe("en");
  });
  it("knows which English pages have a Hebrew edition", () => {
    for (const p of ["/", "/polls", "/coalition-builder", "/compare", "/parties/likud", "/results", "/polls?poll=x", "/compare/", "/about", "/how-it-works", "/elections/il-knesset-26", "/policies/courts", "/news/2026-10-05", "/subscriptions/confirm"]) expect(hasHebrew(p)).toBe(true);
    for (const p of ["/parties", "/ballot"]) expect(hasHebrew(p)).toBe(true);
    for (const p of ["/parties/likud/extra", "/pollsx"]) expect(hasHebrew(p)).toBe(false);
  });
  it("maps English to Hebrew, keeping query and fragment", () => {
    expect(hePath("/")).toBe("/he");
    expect(hePath("/polls")).toBe("/he/polls");
    expect(hePath("/parties/likud#issues")).toBe("/he/parties/likud#issues");
    expect(hePath("/coalition-builder?with=likud,shas")).toBe("/he/coalition-builder?with=likud,shas");
    expect(hePath("/about")).toBe("/he/about");
    expect(hePath("/he/polls")).toBe("/he/polls");
  });
  it("maps Hebrew to English", () => {
    expect(enPath("/he")).toBe("/");
    expect(enPath("/he/")).toBe("/");
    expect(enPath("/he/polls?x=1")).toBe("/polls?x=1");
    expect(enPath("/he/parties/likud")).toBe("/parties/likud");
    expect(enPath("/polls")).toBe("/polls");
  });
  it("tells Hebrew paths from English ones", () => {
    expect(isHePath("/he")).toBe(true);
    expect(isHePath("/he/results")).toBe(true);
    expect(isHePath("/help")).toBe(false);
    expect(isHePath("/")).toBe(false);
  });
  it("finds the other edition of a page when there is one", () => {
    expect(otherEdition("/polls")).toEqual({ lang: "he", href: "/he/polls" });
    expect(otherEdition("/he/compare")).toEqual({ lang: "en", href: "/compare" });
    expect(otherEdition("/glossary")).toBeNull();
  });
});
