import { describe, expect, it } from "vitest";
import { enPath, hasHebrew, hePath, isHePath, otherEdition } from "./index";

describe("edition paths", () => {
  it("knows which English pages have a Hebrew edition", () => {
    for (const p of ["/", "/polls", "/coalition-builder", "/compare", "/parties/likud", "/results", "/polls?poll=x", "/compare/"]) expect(hasHebrew(p)).toBe(true);
    for (const p of ["/about", "/parties", "/parties/likud/extra", "/how-it-works", "/news/2026-10-05", "/pollsx"]) expect(hasHebrew(p)).toBe(false);
  });
  it("maps English to Hebrew, keeping query and fragment", () => {
    expect(hePath("/")).toBe("/he");
    expect(hePath("/polls")).toBe("/he/polls");
    expect(hePath("/parties/likud#issues")).toBe("/he/parties/likud#issues");
    expect(hePath("/coalition-builder?with=likud,shas")).toBe("/he/coalition-builder?with=likud,shas");
    expect(hePath("/about")).toBeNull();
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
