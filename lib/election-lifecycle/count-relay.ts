/**
 * The browser relay for the CEC count files (scripts/live-count/capture.mts). The files sit behind an AWS WAF
 * challenge that only a real browser passes; the relay fetches them there and hands the body to the unchanged
 * acquisition path (acquireDurableCount with a fetcher), so the stored record is exactly what acquireCount writes.
 */
import { parseExpc } from "../results";
import { countHash, validCount } from "../results-snapshot";
import type { Count } from "../results";

/** No relay write before Israel 22:00 on election day (the shared cadence start). */
export const RELAY_OPENS = Date.parse("2026-10-27T20:00:00Z");

export type RelayCheck =
  | { ok: true; count: Count; hash: string }
  | { ok: false; reason: "before_close" | "waf_challenge" | "not_published" | "header_only" | "invalid" };

export function checkRelayCapture({
  status,
  body,
  now,
  wafAction = null,
}: {
  status: number;
  body: string;
  now: number;
  wafAction?: string | null;
}): RelayCheck {
  if (now < RELAY_OPENS) return { ok: false, reason: "before_close" };
  if (status === 202 || wafAction) return { ok: false, reason: "waf_challenge" };
  if (status !== 200) return { ok: false, reason: "not_published" };
  const lines = body.replace(/^﻿/, "").trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { ok: false, reason: "header_only" };
  let count: Count;
  try {
    count = parseExpc(body);
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (!count.valid) return { ok: false, reason: "header_only" };
  if (!validCount(count)) return { ok: false, reason: "invalid" };
  return { ok: true, count, hash: countHash(count) };
}

/** A fetch that answers with the relay's captured body, for acquireCount's own validation and snapshotting. */
export const relayFetcher =
  (body: string, lastModified: string | null): typeof fetch =>
  async () =>
    new Response(body, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        ...(lastModified ? { "last-modified": lastModified } : {}),
      },
    });

/**
 * A partial 2022 count for rehearsals: whole localities in a seeded shuffled order until `share` of local
 * valid votes is counted. Envelope rows are left out (counted last on the night).
 */
export function partialCsv(csv: string, share: number, seed = 26): string {
  const lines = csv.replace(/^﻿/, "").trim().split(/\r?\n/);
  const head = lines[0].split(","),
    iCode = head.indexOf("סמל ישוב"),
    iValid = head.indexOf("כשרים");
  const rows = lines.slice(1).filter((l) => !/^9{4,5}$/.test(l.split(",")[iCode]));
  let a = seed >>> 0;
  const random = () => ((a = (Math.imul(a ^ (a >>> 15), 1 | a) + 0x6d2b79f5) >>> 0) / 4294967296);
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  const total = rows.reduce((n, l) => n + Number(l.split(",")[iValid]), 0);
  const out: string[] = [];
  let counted = 0;
  for (const l of rows) {
    if (counted >= share * total) break;
    out.push(l);
    counted += Number(l.split(",")[iValid]);
  }
  return [lines[0], ...out].join("\n") + "\n";
}
