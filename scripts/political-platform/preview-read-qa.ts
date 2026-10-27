import { writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const origin =
  "https://israelielection-git-codex-political-d7a050-ravbogards-projects.vercel.app";
const locales = ["en", "he", "ar", "fa", "de", "fr", "zh"];
const leakedKeys =
  /"(?:email_ciphertext|payload_ciphertext|token_hash|failureCaptureIds|failureCaptureId|verificationCaptureId|storageKey|candidate|numericRendering|captureIds)"\s*:/i;
function safe(body: string) {
  const decoded = body.replace(/\\"/g, '"');
  return (
    !leakedKeys.test(decoded) &&
    !/synthetic-(?:retry-)?\d@recovery\.invalid|platform-services\.private|GEMINI_API_KEY|POLITICAL_RECORD_DATABASE_URL/.test(
      decoded,
    )
  );
}
function text(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|#160);/g, " ")
    .replace(/\s+/g, " ");
}
function digits(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[٠-٩۰-۹]/g, (c) =>
      String(
        c.charCodeAt(0) >= 0x6f0
          ? c.charCodeAt(0) - 0x6f0
          : c.charCodeAt(0) - 0x660,
      ),
    )
    .replace(/[٫,]/g, ".")
    .replace(/−/g, "-")
    .replace(/[\u061c\u200e\u200f]/g, "");
}
async function main() {
  if (!process.argv.includes("--run")) {
    console.log(
      JSON.stringify({
        status: "dry_run",
        requests: 0,
        writes: 0,
        target: origin,
      }),
    );
    return;
  }
  if (process.env.VERCEL_ENV !== "preview") throw Error("preview_only");
  const bypass =
    process.env.ELECTION_PREVIEW_PROTECTION_BYPASS ??
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const headers: Record<string, string> = {
    "Cache-Control": "no-cache",
    ...(bypass ? { "x-vercel-protection-bypass": bypass } : {}),
  };
  const fetchOwned = async (
    path: string,
    extra: Record<string, string> = {},
  ) => {
    const url = new URL(path, origin);
    if (url.origin !== origin) throw Error("owned_origin_only");
    return fetch(url, {
      headers: { ...headers, ...extra },
      redirect: "error",
      signal: AbortSignal.timeout(60000),
    });
  };
  const checks = [];
  let failed = false;
  const requireAllLocales = process.argv.includes("--require-all-locales"),
    requireChanges = process.argv.includes("--require-global-changes");
  for (const locale of locales) {
    const response = await fetchOwned(
        `/api/v2/publications?lang=${locale}&election=il-knesset-26&limit=10`,
      ),
      raw = await response.text();
    const body = response.headers
      .get("content-type")
      ?.includes("application/json")
      ? JSON.parse(raw)
      : null;
    const records = Array.isArray(body?.records) ? body.records : [];
    const ready = records.filter(
      (row: {
        payload?: { content?: unknown; currentTextUnavailable?: boolean };
      }) =>
        row.payload?.content && row.payload.currentTextUnavailable === false,
    );
    const qualified = ready.every(
      (row: {
        payload: {
          locale?: string;
          sourceRefs?: { url: string; publisher: string; observedAt: string }[];
          editionRevisionId?: string;
        };
        status: string;
        evidenceClass: string;
      }) =>
        row.status === "confirmed" &&
        row.evidenceClass === "primary_confirmed" &&
        row.payload.locale === locale &&
        /^[a-f0-9]{64}$/.test(row.payload.editionRevisionId ?? "") &&
        row.payload.sourceRefs?.some(
          (source) =>
            source.url.startsWith("https://api.cbs.gov.il/index/data/price?") &&
            !!source.publisher &&
            Number.isFinite(Date.parse(source.observedAt)),
        ),
    );
    const privacy = safe(raw),
      passed =
        response.status === 200 &&
        body?.storage === "postgres" &&
        body?.historyReady === true &&
        body?.locale === locale &&
        privacy &&
        qualified &&
        records.length > 0;
    const etag = response.headers.get("etag");
    let conditionalStatus: number | null = null;
    if (locale === "en" && etag)
      conditionalStatus = (
        await fetchOwned(
          `/api/v2/publications?lang=${locale}&election=il-knesset-26&limit=10`,
          { "If-None-Match": etag },
        )
      ).status;
    checks.push({
      kind: "publications",
      locale,
      status: response.status,
      passed,
      storage: body?.storage,
      historyReady: body?.historyReady,
      records: records.length,
      ready: ready.length,
      pending: records.length - ready.length,
      qualified,
      privacy,
      etag: !!etag,
      conditionalStatus,
      contentHashes: ready.map((row: { payload: { content: unknown } }) =>
        createHash("sha256")
          .update(JSON.stringify(row.payload.content))
          .digest("hex"),
      ),
    });
    failed ||=
      !passed ||
      ((locale === "en" || requireAllLocales) && ready.length === 0) ||
      (conditionalStatus !== null && conditionalStatus !== 304);
    for (const view of ["/changes", "/policies/economy"]) {
      const path = (locale === "en" ? "" : "/" + locale) + view,
        result = await fetchOwned(path),
        html = await result.text(),
        visible = digits(text(html));
      const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(
        (match) => digits(text(match[1])),
      );
      const september = rows.some(
        (row) =>
          row.includes("2026-09") &&
          row.includes("105.3") &&
          row.includes("-0.5") &&
          row.includes("1.6") &&
          row.includes("2024") &&
          row.includes("%"),
      );
      const source = html.includes("https://api.cbs.gov.il/index/data/price"),
        time = /<time\b[^>]*datetime=/i.test(html),
        privacy = safe(html);
      const noticeRendered =
        html.includes("data-global-publications") && source;
      const passed =
        result.status === 200 &&
        privacy &&
        (view === "/changes"
          ? !requireChanges || noticeRendered
          : september && source && time);
      checks.push({
        kind: "page",
        locale,
        path,
        status: result.status,
        passed,
        privacy,
        septemberUnitsAndBase: september,
        noticeRendered,
        source,
        time,
        globalCbsTrace:
          visible.includes("indicator:cbs:") || visible.includes("2026-09"),
      });
      failed ||= !passed;
    }
  }
  const receipt = {
    status: failed ? "failed" : "passed",
    checkedAt: new Date().toISOString(),
    target: origin,
    checks,
    requestsAreReadOnly: true,
    upstreamAcquisitionsInvoked: 0,
    providerCalls: 0,
    recoveries: 0,
    sourceMutations: 0,
  };
  await writeFile(
    ".vercel/platform-preview-read-qa.receipt.json",
    JSON.stringify(receipt, null, 2),
    { mode: 0o600 },
  );
  console.log(JSON.stringify(receipt));
  if (failed) process.exitCode = 1;
}
main().catch(() => {
  console.error(
    "preview_read_qa_unavailable; headers, response bodies and credentials withheld",
  );
  process.exitCode = 1;
});
