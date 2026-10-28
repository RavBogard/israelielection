import { describe, expect, it, vi } from "vitest";
import { alternates, heAlternates, RSS } from "./canonical";
import { LANGS } from "./i18n";

// These tests describe the announced edition; HE_PUBLIC stays off in the code until the Hebrew is reviewed.
vi.mock("./i18n", async (orig) => ({
  ...(await orig<typeof import("./i18n")>()),
  HE_PUBLIC: true,
}));

describe("alternates", () => {
  it("does not advertise pending source-prose translations as reviewed editions", () => {
    expect(alternates("/party-history")).toEqual({ canonical: "/party-history", types: RSS });
    // /about has a written Hebrew edition; the other five languages are still pending and stay unadvertised.
    expect(Object.keys((alternates("/about") as { languages?: object }).languages ?? {}).sort()).toEqual(["en", "he", "x-default"]);
  });
  it("announces both implemented party-directory tools in all seven locales", () => {
    for (const path of ["/parties", "/ballot"]) {
      const languages = {
        ...Object.fromEntries(
          LANGS.map((lang) => [
            lang,
            `${lang === "en" ? "" : "/" + lang}${path}`,
          ]),
        ),
        "x-default": path,
      };
      expect(alternates(path)).toEqual({
        canonical: path,
        languages,
        types: RSS,
      });
      expect(heAlternates("/he" + path)).toEqual({
        canonical: "/he" + path,
        languages,
      });
    }
  });
  it("adds hreflang to pages with a Hebrew edition", () => {
    expect(alternates("/polls")).toEqual({
      canonical: "/polls",
      languages: {
        en: "/polls",
        he: "/he/polls",
        ar: "/ar/polls",
        fa: "/fa/polls",
        de: "/de/polls",
        fr: "/fr/polls",
        zh: "/zh/polls",
        "x-default": "/polls",
      },
      types: RSS,
    });
    expect(alternates("/")).toEqual({
      canonical: "/",
      languages: {
        en: "/",
        he: "/he",
        ar: "/ar",
        fa: "/fa",
        de: "/de",
        fr: "/fr",
        zh: "/zh",
        "x-default": "/",
      },
      types: RSS,
    });
    expect(alternates("/parties/likud")?.languages).toEqual({
      en: "/parties/likud",
      he: "/he/parties/likud",
      ar: "/ar/parties/likud",
      fa: "/fa/parties/likud",
      de: "/de/parties/likud",
      fr: "/fr/parties/likud",
      zh: "/zh/parties/likud",
      "x-default": "/parties/likud",
    });
  });
  it("gives Hebrew pages their own canonical and the same hreflang set", () => {
    expect(heAlternates("/he/polls")).toEqual({
      canonical: "/he/polls",
      languages: {
        en: "/polls",
        he: "/he/polls",
        ar: "/ar/polls",
        fa: "/fa/polls",
        de: "/de/polls",
        fr: "/fr/polls",
        zh: "/zh/polls",
        "x-default": "/polls",
      },
    });
    expect(heAlternates("/he")).toEqual({
      canonical: "/he",
      languages: {
        en: "/",
        he: "/he",
        ar: "/ar",
        fa: "/fa",
        de: "/de",
        fr: "/fr",
        zh: "/zh",
        "x-default": "/",
      },
    });
  });
});
