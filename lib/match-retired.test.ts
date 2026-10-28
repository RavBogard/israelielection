import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import { NAV, NAV_GROUPS, NAV_UTILITIES } from "./site";

describe("Party match is retired (Daniel, 2026-10-28)", () => {
  it("is out of every menu", () => {
    const hrefs = [...NAV_GROUPS.flatMap((g) => g.items), ...NAV_UTILITIES, ...NAV].map((n) => n.href);
    expect(hrefs.filter((h) => /(^|\/)match$/.test(h))).toEqual([]);
  });
  it("redirects /match and every edition's match page to the party map, temporarily", async () => {
    type Config = { redirects?: () => Promise<{ source: string; destination: string; permanent?: boolean }[]> };
    const raw = nextConfig as unknown as Config | ((phase: string, ctx: unknown) => Promise<Config>);
    const config = typeof raw === "function" ? await raw("phase-production-build", { defaultConfig: {} }) : raw;
    const rules = (await config.redirects?.()) ?? [];
    const plain = rules.find((r) => r.source === "/match");
    const localized = rules.find((r) => r.source.endsWith("/match") && r.source.includes(":lang"));
    expect(plain).toMatchObject({ destination: "/parties", permanent: false });
    expect(localized).toMatchObject({ destination: "/:lang/parties", permanent: false });
    for (const lang of ["he", "ar", "fa", "de", "fr", "zh"]) expect(localized!.source).toContain(lang);
  });
});
