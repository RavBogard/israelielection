// The election night in both editions, rendered from lib/fixtures/cec-2022-expc.csv (the 2022 committee file):
// before close, waiting for the first file, an early count (a few localities) and the full count.
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {} }) }));

const FIXTURE = join(process.cwd(), "lib/fixtures/cec-2022-expc.csv");
const BEFORE = "2026-10-27T12:00:00+02:00";
const AFTER = "2026-10-27T22:20:00+02:00";

/** The first n localities of the 2022 file, so the count holds under a tenth of the roll. */
function earlyFixture(n = 40): string {
  const lines = readFileSync(FIXTURE, "utf8").trim().split(/\r?\n/);
  const path = join(mkdtempSync(join(tmpdir(), "rs-")), "early.csv");
  writeFileSync(path, [lines[0], ...lines.slice(1, n + 1)].join("\n"));
  return path;
}

async function render(lang: "en" | "he", env: Record<string, string>, fetcher?: typeof fetch) {
  vi.stubEnv("NODE_ENV", "development");
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  if (fetcher) vi.stubGlobal("fetch", fetcher);
  vi.resetModules();
  const { default: ResultsPage } = await import("./ResultsPage");
  const LangMod = await import("@/lib/i18n/lang");
  const React = await import("react");
  const page = await ResultsPage({ lang, revalidate: 60 });
  return renderToStaticMarkup(React.createElement(LangMod.LangProvider, { lang }, page));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("/he/results through the night", () => {
  it("before close: the count's start, the hatched board, nothing marked", async () => {
    const html = await render("he", { RESULTS_NOW: BEFORE });
    expect(html).toContain("ספירת הקולות מתחילה עם סגירת הקלפיות, ביום שלישי, 27 באוקטובר, 22:00.");
    expect(html).toContain("ממתינים לספירה");
    expect(html).toContain("על מה להסתכל");
    expect(html).not.toContain('aria-current="step"');
    expect(html).not.toContain("Israel time");
  });
  it("after close, no file yet: waiting, exit polls lead, the refresh button", async () => {
    const html = await render("he", { RESULTS_NOW: AFTER }, (async () => new Response("", { status: 404 })) as typeof fetch);
    expect(html).toContain("ממתינים לנתונים הראשונים של ועדת הבחירות המרכזית. בדיקה אחרונה ב-22:20");
    expect(html).toMatch(/aria-current="step"[^>]*>מדגמי הערוצים 22:00/);
    expect(html).toContain("בדקו אם יש עדכון");
    expect(html.indexOf("מדגמי הערוצים</h2>")).toBeLessThan(html.indexOf("לפי רשימה"));
  });
  it("early count: the early flag over the board, Hebrew names, threshold watch", async () => {
    const html = await render("he", { RESULTS_NOW: AFTER, RESULTS_FIXTURE: earlyFixture() });
    expect(html).toMatch(/aria-current="step"[^>]*>תוצאות אמת ראשונות/);
    expect(html).toContain("<b>תוצאות אמת ראשונות.</b> נספרו עד כה יישובים שבהם");
    expect(html).toContain("תוצאות אמת ראשונות של ועדת הבחירות המרכזית, נכון ל-");
    expect(html).toContain("קובץ חזרה מקומי, לא ספירת הקולות של 2026.");
    expect(html).toContain("הליכוד");
    expect(html).toContain("/he/coalition-builder?poll=results");
  });
  it("full count: the count is current, differences in <bdi>, envelopes line", async () => {
    const html = await render("he", { RESULTS_NOW: AFTER, RESULTS_FIXTURE: FIXTURE });
    expect(html).toMatch(/aria-current="step"[^>]*>ספירת הקולות/);
    expect(html).toContain("ספירת הקולות של ועדת הבחירות המרכזית, נכון ל-");
    expect(html).toMatch(/<bdi dir="ltr">[+−0]/);
    expect(html).toContain("המעטפות הכפולות: ");
    expect(html).toContain("אחוז החסימה: ");
    expect(html).not.toMatch(/\b1 מנדטים/);
  });
  it("English keeps its own words in the same states", async () => {
    const before = await render("en", { RESULTS_NOW: BEFORE });
    expect(before).toContain("The count starts when polls close, Oct 27, 10:00 PM Israel time (4:00 PM EDT).");
    const count = await render("en", { RESULTS_NOW: AFTER, RESULTS_FIXTURE: FIXTURE });
    expect(count).toContain("The committee’s count so far, captured");
    expect(count).not.toMatch(/[א-ת]{2,} [א-ת]{2,} [א-ת]{2,} מנדטים/);
    expect(count).not.toContain("<bdi");
  });
});
