import { test, expect } from "@playwright/test";
const origin =
  process.env.PLATFORM_MONITOR_BROWSER_ORIGIN ??
  "https://www.israelielection.org";
const parsed = new URL(origin),
  preview =
    origin === process.env.PLATFORM_MONITOR_PREVIEW_ORIGIN &&
    /^israelielection(?:-[a-z0-9-]+)?\.vercel\.app$/.test(parsed.hostname);
if (
  parsed.origin !== origin ||
  parsed.protocol !== "https:" ||
  (origin !== "https://www.israelielection.org" && !preview)
)
  throw new Error("monitor_origin_not_allowed");
for (const locale of ["en", "he", "ar", "fa", "de", "fr", "zh"]) {
  test(`render ${locale} homepage and stored-state tools`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: {
        width:
          locale === "he" || locale === "ar" || locale === "fa" ? 390 : 1280,
        height: 900,
      },
      locale: locale === "en" ? "en-US" : locale,
    });
    await context.addCookies([{ name: "lang", value: locale, url: origin }]);
    await context.route("**/*", async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      if (url.origin !== origin) return route.abort();
      const headers = { ...request.headers() };
      delete headers["x-vercel-protection-bypass"];
      if (preview && process.env.PLATFORM_MONITOR_PREVIEW_BYPASS)
        headers["x-vercel-protection-bypass"] =
          process.env.PLATFORM_MONITOR_PREVIEW_BYPASS;
      return route.continue({ headers });
    });
    const page = await context.newPage();
    let pageErrors = 0;
    page.on("pageerror", () => {
      pageErrors++;
    });
    try {
      for (const path of ["/", "/results", "/government"]) {
        const selected =
          locale === "en" ? path : `/${locale}${path === "/" ? "" : path}`;
        const response = await page.goto(origin + selected, {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        });
        expect(response?.status()).toBe(200);
        expect(new URL(page.url()).origin).toBe(origin);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("main")).toBeVisible();
        expect(
          (await page.locator("main").innerText()).trim().length,
        ).toBeGreaterThan(80);
        await expect(page.getByRole("banner")).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 2,
        );
        expect(overflow).toBe(false);
      }
      expect(pageErrors).toBe(0);
    } finally {
      await context.close();
    }
  });
}
