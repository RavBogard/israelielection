/**
 * Browser relay for the CEC count past its AWS WAF challenge. Runs on an operator machine (or the backup
 * GitHub workflow). Each cycle: open votes26 in Chromium (obtains aws-waf-token), fetch expc.csv (and expb.csv
 * for the log) through that browser context, validate with the strict CSV totals check, and write a valid file
 * through acquireDurableCount, the same path acquireCount uses on the server. After a changed write it asks
 * QStash to rerun the live forecast worker and then the lifecycle worker. The official national results page
 * is captured too; once the strict official parser accepts it, it is imported via import-evidence.mts.
 *
 *   node --env-file=<platform-production.env> node_modules/tsx/dist/cli.mjs scripts/live-count/capture.mts \
 *     --target production [--interval 3] [--dry-run] [--once] [--headed] [--no-official] [--no-refresh]
 *   Rehearsal (preview only): --target preview --replay lib/fixtures/cec-2022-expc.csv --share 0.05 --once
 *
 * Never prints credentials.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { chromium, type Browser, type BrowserContext } from "playwright";
import { acquireDurableCount, readCountRecord, countNamespace } from "../../lib/election-lifecycle/count-store";
import { checkRelayCapture, partialCsv, relayFetcher } from "../../lib/election-lifecycle/count-relay";
import { officialOptions, parseOfficialSeats, OFFICIAL_URLS } from "../../lib/election-lifecycle/official";
import config from "../../data/results.json";

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const flag = (name: string) => process.argv.includes(name);
const target = arg("--target"),
  dryRun = flag("--dry-run"),
  once = flag("--once"),
  headed = flag("--headed"),
  official = !flag("--no-official"),
  replay = arg("--replay"),
  share = Number(arg("--share") ?? "1"),
  noRefresh = flag("--no-refresh"),
  interval = Math.max(1, Number(arg("--interval") ?? "3"));
if (!target || !["production", "preview"].includes(target)) throw new Error("--target production|preview is required");
if ((process.env.ELECTION_LIFECYCLE_NAMESPACE ?? process.env.VERCEL_ENV) !== target)
  throw new Error(`Loaded environment is not ${target}; pass the matching --env-file`);
if (replay && target !== "preview") throw new Error("--replay writes rehearsal data and is preview-only");
if (!dryRun && !(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL))
  throw new Error("Count store credentials missing (KV_REST_API_URL/KV_REST_API_TOKEN)");

const SITE = OFFICIAL_URLS[1];
const EXPB = config.source.url.replace(/expc\.csv$/, "expb.csv");
const log = (fields: Record<string, unknown>) =>
  console.log([new Date().toISOString(), ...Object.entries(fields).map(([k, v]) => `${k}=${v}`)].join(" "));

let browser: Browser | null = null,
  context: BrowserContext | null = null;
async function openContext(show: boolean) {
  await browser?.close().catch(() => {});
  browser = await chromium.launch({ headless: !show });
  // The WAF serves headless Chromium's default "HeadlessChrome" agent a 404; the same browser as plain Chrome passes.
  const probe = await browser.newPage();
  const userAgent = (await probe.evaluate(() => navigator.userAgent)).replace("HeadlessChrome", "Chrome");
  await probe.close();
  context = await browser.newContext({ locale: "he-IL", userAgent, acceptDownloads: true });
}
/** The aws-waf-token is per host: votes26's does not open media26, so the file host is visited itself once. */
async function primeFileHost() {
  if ((await context!.cookies()).some((c) => c.name === "aws-waf-token" && c.domain.endsWith("media26.bechirot.gov.il"))) return;
  const page = await context!.newPage();
  try {
    await page.goto(config.source.url, { waitUntil: "networkidle", timeout: 45_000 }).catch(() => {});
    await page.waitForTimeout(3_000);
  } finally {
    await page.close();
  }
}
/** Load the site (passes the challenge, sets aws-waf-token), then read a file through the same context. */
async function browserGet(url: string) {
  const res = await context!.request.get(url, { timeout: 20_000, failOnStatusCode: false });
  return {
    status: res.status(),
    body: await res.text(),
    waf: res.headers()["x-amzn-waf-action"] ?? null,
    lastModified: res.headers()["last-modified"] ?? null,
  };
}
async function loadSite() {
  const page = await context!.newPage();
  try {
    await page.goto(SITE, { waitUntil: "networkidle", timeout: 45_000 }).catch(() => {});
    await page.waitForTimeout(2_000);
    const html = await page.content();
    await primeFileHost();
    const token = (await context!.cookies()).some((c) => c.name === "aws-waf-token" && c.domain.endsWith("media26.bechirot.gov.il"));
    return { html, token };
  } finally {
    await page.close();
  }
}

async function refresh() {
  const { QSTASH_URL, QSTASH_TOKEN, LIVE_FORECAST_WORKER_URL, ELECTION_LIFECYCLE_WORKER_URL } = process.env;
  if (!QSTASH_URL || !QSTASH_TOKEN || !LIVE_FORECAST_WORKER_URL || !ELECTION_LIFECYCLE_WORKER_URL) {
    log({ refresh: "skipped_unconfigured" });
    return;
  }
  const publish = (dest: string, body: string) =>
    fetch(`${QSTASH_URL}/v2/publish/${dest}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${QSTASH_TOKEN}`, "Content-Type": "application/json" },
      body,
    }).then((r) => r.status);
  const f = await publish(LIVE_FORECAST_WORKER_URL, "{}");
  await new Promise((r) => setTimeout(r, 30_000));
  const l = await publish(ELECTION_LIFECYCLE_WORKER_URL, '{"mode":"election"}');
  log({ refresh: `forecast:${f} lifecycle:${l}` });
}

let lastOfficial: string | null = null;
function importOfficial(html: string, now: string) {
  try {
    const snapshot = parseOfficialSeats(html, officialOptions(now, SITE));
    if (snapshot.snapshotRevision === lastOfficial) return "official=unchanged";
    if (dryRun) return `official=parsed_dry_run seats=${Object.values(snapshot.pointSeats).reduce((a, b) => a + b, 0)}`;
    const file = path.join(os.tmpdir(), `cec-official-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify({ sourceUrl: new URL(SITE).href, html }));
    const r = spawnSync(
      process.execPath,
      [
        path.resolve("node_modules/tsx/dist/cli.mjs"),
        "scripts/election-lifecycle/import-evidence.mts",
        "--file", file, "--url", new URL(SITE).href, "--target", target!,
        ...(target === "production" ? ["--confirm-production"] : []),
        "--apply", "--operator", "count-relay",
      ],
      { encoding: "utf8", env: process.env },
    );
    fs.rmSync(file, { force: true });
    if (r.status === 0) lastOfficial = snapshot.snapshotRevision;
    return `official=${r.status === 0 ? "imported" : "import_failed:" + (r.stderr.split("\n").find((l) => /Error/.test(l)) ?? r.status)}`;
  } catch (e) {
    return `official=${(e as Error).message}`;
  }
}

async function cycle() {
  const now = new Date().toISOString();
  let expc: { status: number; body: string; waf: string | null; lastModified: string | null };
  let site = { html: "", token: false };
  if (replay) {
    expc = { status: 200, body: partialCsv(fs.readFileSync(replay, "utf8"), share), waf: null, lastModified: null };
  } else {
    site = await loadSite();
    expc = await browserGet(config.source.url);
    if (expc.status === 202 || expc.waf) {
      // The token aged out or the challenge was not passed: a fresh browser re-runs it once.
      await openContext(headed);
      site = await loadSite();
      expc = await browserGet(config.source.url);
    }
  }
  const check = checkRelayCapture({ status: expc.status, body: expc.body, now: Date.parse(now), wafAction: expc.waf });
  const rows = Math.max(0, expc.body.trim().split(/\r?\n/).length - 1);
  const fields: Record<string, unknown> = {
    target,
    token: replay ? "replay" : site.token,
    http: expc.status,
    rows,
    valid: check.ok ? check.count.valid : 0,
  };
  if (!replay) {
    const b = await browserGet(EXPB).catch(() => null);
    if (b) fields.expb = `${b.status}/${Math.max(0, b.body.trim().split(/\r?\n/).length - 1)}rows`;
  }
  let wrote = false;
  if (!check.ok) fields.result = `refused_${check.reason}`;
  else {
    const stored = await readCountRecord().catch(() => null);
    const changed = stored?.current?.hash !== check.hash;
    if (dryRun) fields.result = changed ? "would_write" : "unchanged";
    else {
      // Unchanged files still refresh health, so a quiet count is not shown as overdue.
      const r = await acquireDurableCount(now, undefined, relayFetcher(expc.body, expc.lastModified));
      fields.result = changed ? `written:${r.status}` : `unchanged:${r.status}`;
      wrote = changed && r.status === "acquired";
    }
  }
  if (official && !replay && site.html) fields.official = importOfficial(site.html, now).replace(/^official=/, "");
  log(fields);
  if (wrote && !noRefresh) await refresh();
}

log({ start: target, namespace: countNamespace().replace(/:$/, ""), dryRun, interval, replay: replay ?? "none" });
if (!replay) await openContext(headed);
for (;;) {
  try {
    await cycle();
  } catch (e) {
    log({ error: (e as Error).message.slice(0, 200) });
    if (!replay) await openContext(headed).catch(() => {});
  }
  if (once) break;
  await new Promise((r) => setTimeout(r, interval * 60_000));
}
await (browser as Browser | null)?.close();
