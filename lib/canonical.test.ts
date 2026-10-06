import { describe, expect, it, vi } from "vitest";
import { alternates, heAlternates, RSS } from "./canonical";

// These tests describe the announced edition; HE_PUBLIC stays off in the code until the Hebrew is reviewed.
vi.mock("./i18n", async (orig) => ({ ...(await orig<typeof import("./i18n")>()), HE_PUBLIC: true }));

describe("alternates", () => {
  it("leaves English-only pages as they were", () => {
    expect(alternates("/about")).toEqual({ canonical: "/about", types: RSS });
    expect(alternates("/parties")).toEqual({ canonical: "/parties", types: RSS });
  });
  it("adds hreflang to pages with a Hebrew edition", () => {
    expect(alternates("/polls")).toEqual({ canonical: "/polls", languages: { en: "/polls", he: "/he/polls", "x-default": "/polls" }, types: RSS });
    expect(alternates("/")).toEqual({ canonical: "/", languages: { en: "/", he: "/he", "x-default": "/" }, types: RSS });
    expect(alternates("/parties/likud")?.languages).toEqual({ en: "/parties/likud", he: "/he/parties/likud", "x-default": "/parties/likud" });
  });
  it("gives Hebrew pages their own canonical and the same hreflang set", () => {
    expect(heAlternates("/he/polls")).toEqual({ canonical: "/he/polls", languages: { en: "/polls", he: "/he/polls", "x-default": "/polls" } });
    expect(heAlternates("/he")).toEqual({ canonical: "/he", languages: { en: "/", he: "/he", "x-default": "/" } });
  });
});
