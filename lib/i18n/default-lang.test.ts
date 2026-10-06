import { describe, expect, it } from "vitest";
import { defaultLang, firstLanguage, type Visit } from "./default-lang";

const visit = (v: Partial<Visit>): Visit => ({ cookie: undefined, country: "US", acceptLanguage: "en-US,en;q=0.9", userAgent: "Mozilla/5.0", referer: null, origin: "https://www.israelielection.org", ...v });

describe("the browser's first language", () => {
  it("reads the first tag, by quality", () => {
    expect(firstLanguage("he-IL,he;q=0.9,en;q=0.8")).toBe("he");
    expect(firstLanguage("en;q=0.5,he;q=0.9")).toBe("he");
    expect(firstLanguage("en-US,he;q=0.9")).toBe("en");
    expect(firstLanguage("iw")).toBe("he");
    expect(firstLanguage("*")).toBeNull();
    expect(firstLanguage(null)).toBeNull();
  });
});

describe("the default edition", () => {
  it("sends readers in Israel and Hebrew-first browsers to Hebrew", () => {
    expect(defaultLang(visit({ country: "IL" }))).toBe("he");
    expect(defaultLang(visit({ acceptLanguage: "he-IL,en;q=0.8" }))).toBe("he");
  });
  it("leaves everyone else on English", () => {
    expect(defaultLang(visit({}))).toBeNull();
    expect(defaultLang(visit({ acceptLanguage: "en-US,he;q=0.9" }))).toBeNull();
    expect(defaultLang(visit({ country: null, acceptLanguage: null }))).toBeNull();
  });
  it("keeps the toggle's choice over country and browser", () => {
    expect(defaultLang(visit({ country: "IL", cookie: "en" }))).toBe("en");
    expect(defaultLang(visit({ cookie: "he" }))).toBe("he");
  });
  it("never redirects a click inside the site, a crawler or a link preview", () => {
    expect(defaultLang(visit({ country: "IL", referer: "https://www.israelielection.org/he/polls" }))).toBeNull();
    expect(defaultLang(visit({ country: "IL", referer: "https://israelielection.org/about" }))).toBeNull();
    expect(defaultLang(visit({ country: "IL", referer: "https://www.google.co.il/" }))).toBe("he");
    expect(defaultLang(visit({ country: "IL", userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)" }))).toBeNull();
    expect(defaultLang(visit({ country: "IL", userAgent: "WhatsApp/2.23" }))).toBeNull();
  });
});
