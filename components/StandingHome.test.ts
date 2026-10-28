import "@/lib/i18n/ar/register";
import "@/lib/i18n/fa/register";
import "@/lib/i18n/de/register";
import "@/lib/i18n/fr/register";
import "@/lib/i18n/zh/register";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LANGS } from "@/lib/i18n";
import { LangProvider } from "@/lib/i18n/lang";
import { swornGovernment } from "@/lib/standing-home";
import { formingSnapshot, governingSnapshot } from "@/lib/fixtures/standing-home";
import type { ElectionLifecycleSnapshot } from "@/lib/election-lifecycle/types";
import StandingHome from "./StandingHome";

const lifecycle = vi.hoisted(() => ({ current: null as ElectionLifecycleSnapshot | null }));
vi.mock("@/lib/seat-context-server", () => ({
  lifecycleForRender: async () => lifecycle.current,
  seatContextForRender: async () => lifecycle.current?.seatContext ?? null,
}));
vi.mock("@/components/HomeHeadlines", () => ({ homeHeadlines: async () => null }));
afterEach(() => vi.unstubAllEnvs());

describe.each(LANGS)("%s standing-reference home", (lang) => {
  it("leads with the sworn-in government in the hall, then the facts, the next election and the reference links", () => {
    const s = governingSnapshot(), g = swornGovernment(s)!;
    const html = renderToStaticMarkup(createElement(StandingHome, { government: g, snapshot: s, lang }));
    expect(html).toContain('data-testid="standing-home"');
    // Graphic first: the chamber comes before any heading.
    expect(html.indexOf('data-testid="standing-chamber"')).toBeLessThan(html.indexOf("<h1"));
    expect(html.match(/<circle/g) ?? []).toHaveLength(120);
    expect(html.match(/data-side="coalition"/g) ?? []).toHaveLength(68);
    expect(html.match(/data-side="opposition"/g) ?? []).toHaveLength(52);
    expect(html).toContain("Fixture Person");
    expect(html.match(/<li data-list=/g) ?? []).toHaveLength(7);
    expect(html).toContain('dateTime="2030-11-12"');
    expect(html).toContain('data-testid="standing-links"');
    expect(html).toContain(`href="${lang === "en" ? "" : `/${lang}`}/elections/il-knesset-26"`);
  });
});

describe("home page trigger", () => {
  const render = async () => {
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("ELECTION_LIFECYCLE_ENABLED", "false");
    vi.stubEnv("RESULTS_NOW", "2026-11-10T12:00:00+02:00");
    vi.resetModules();
    const { default: HomePage } = await import("./pages/HomePage");
    return renderToStaticMarkup(createElement(LangProvider, { lang: "en" }, await HomePage({ lang: "en", revalidate: 60 })));
  };
  it("keeps the count hero while the government is still forming", async () => {
    lifecycle.current = formingSnapshot();
    const html = await render();
    expect(html).not.toContain('data-testid="standing-home"');
    expect(html).toContain('data-testid="chamber-hero"');
  });
  it("switches to the standing reference once the record shows a government sworn in", async () => {
    lifecycle.current = governingSnapshot();
    const html = await render();
    expect(html).toContain('data-testid="standing-home"');
    expect(html).not.toContain('data-testid="chamber-hero"');
  });
});

describe("forecast page once official", () => {
  it("hides the campaign-snapshot record and keeps it while unofficial", async () => {
    const { default: ForecastPage } = await import("./pages/ForecastPage");
    lifecycle.current = governingSnapshot();
    const official = renderToStaticMarkup(createElement(LangProvider, { lang: "en" }, await ForecastPage({ lang: "en" })));
    expect(official).not.toContain('class="election-record"');
    lifecycle.current = null;
    const before = renderToStaticMarkup(createElement(LangProvider, { lang: "en" }, await ForecastPage({ lang: "en" })));
    expect(before).toContain('class="election-record"');
  });
});
