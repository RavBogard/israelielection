import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { historyText } from "../../lib/i18n/history";
const preview =
  "https://israelielection-git-codex-political-d7a050-ravbogards-projects.vercel.app";
async function main() {
  if (!process.argv.includes("--run")) {
    console.log(JSON.stringify({ status: "dry_run", requests: 0 }));
    return;
  }
  const local = process.argv.includes("--local"),
    origin = local ? "http://localhost:3116" : preview;
  if (!local && process.env.VERCEL_ENV !== "preview")
    throw Error("preview_only");
  const bypass = local
    ? undefined
    : (process.env.ELECTION_PREVIEW_PROTECTION_BYPASS ??
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET);
  const browser = await chromium.launch(),
    checks = [];
  try {
    for (const lang of ["en", "he"] as const)
      for (const mobile of [false, true]) {
        const context = await browser.newContext({
          viewport: { width: mobile ? 390 : 1280, height: 900 },
          colorScheme: mobile ? "dark" : "light",
          locale: lang === "en" ? "en-US" : "he",
        });
        await context.addCookies([{ name: "lang", value: lang, url: origin }]);
        await context.route("**/*", (route) => {
          if (new URL(route.request().url()).origin !== origin)
            return route.abort();
          const headers = { ...route.request().headers() };
          delete headers["x-vercel-protection-bypass"];
          if (bypass) headers["x-vercel-protection-bypass"] = bypass;
          return route.continue({ headers });
        });
        const page = await context.newPage();
        let errors = 0;
        page.on("pageerror", () => errors++);
        for (const slug of ["timeline", "party-history"]) {
          const response = await page.goto(
            `${origin}${lang === "en" ? "" : "/he"}/${slug}`,
            { waitUntil: "networkidle", timeout: 60000 },
          );
          const root = page.locator(`[data-historical-view="${slug}"]`);
          await root.waitFor({ state: "visible" });
          let interactive = false;
          if (slug === "timeline") {
            const slider = root.locator('input[type="range"]'),
              before = Number(await slider.inputValue());
            await slider.focus();
            await slider.press("ArrowRight");
            const stepped = Number(await slider.inputValue()) === before + 1;
            const heading = await root.locator(".tl-ev h2").textContent();
            await root
              .getByRole("button", {
                name: historyText(lang).next,
                exact: true,
              })
              .click();
            interactive =
              stepped &&
              (await root.locator(".tl-ev h2").textContent()) !== heading;
            await root
              .locator(".tl")
              .screenshot({
                path: `.vercel/history-${lang}-${mobile ? "mobile-dark" : "desktop-light"}-timeline.png`,
              });
          } else {
            const search = root.locator('input[type="search"]');
            await search.fill("Meretz");
            const filtered = await root.locator(".history-branch").count();
            interactive =
              filtered === 1 && (await root.locator("#dem").isVisible());
            await search.fill("does-not-exist-fixture");
            interactive &&=
              (await root.locator(".history-branch").count()) === 0;
            await search.fill("");
            const family = root.locator("select");
            await family.selectOption("Haredi parties");
            interactive &&=
              (await root.locator(".history-branch").count()) === 2;
            await family.selectOption("all");
            await root
              .locator(".ph-lanes")
              .screenshot({
                path: `.vercel/history-${lang}-${mobile ? "mobile-dark" : "desktop-light"}-parties.png`,
              });
          }
          const overflow = await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth + 2,
            ),
            passed =
              response?.status() === 200 &&
              !overflow &&
              errors === 0 &&
              interactive;
          checks.push({
            lang,
            mobile,
            slug,
            status: response?.status(),
            overflow,
            errors,
            interactive,
            passed,
          });
        }
        await context.close();
      }
  } finally {
    await browser.close();
  }
  const receipt = {
    status: checks.every((row) => row.passed) ? "passed" : "failed",
    checkedAt: new Date().toISOString(),
    origin,
    checks,
    providerCalls: 0,
    sourceMutations: 0,
  };
  await writeFile(
    `.vercel/history-${local ? "local" : "preview"}-qa.receipt.json`,
    JSON.stringify(receipt, null, 2),
  );
  console.log(JSON.stringify(receipt));
  if (receipt.status !== "passed") process.exitCode = 1;
}
main().catch(() => {
  console.error(
    "history_browser_qa_unavailable; request headers and response bodies withheld",
  );
  process.exitCode = 1;
});
