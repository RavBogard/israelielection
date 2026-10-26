import registry from "../../data/election-lifecycle-sources.json";
import { isTestEnvironment } from "./html";

/** Private editorial captures still require the same verified publisher and exact URL provenance. */
export function validatePrimaryCapture(raw: string, sourceUrl: string) {
  const url = new URL(sourceUrl);
  if (url.protocol !== "https:" || url.username || url.password || url.port)
    throw new Error("source_not_allowed");
  const isCEC = [
    "cdn-votes26.bechirot.gov.il",
    "votes26.bechirot.gov.il",
  ].includes(url.hostname);
  const registered = registry.sources.find((s) =>
    s.hosts.includes(url.hostname),
  );
  if (!isCEC && !registered) throw new Error("publisher_not_verified");
  const envelope = raw.trimStart().startsWith("{") ? JSON.parse(raw) : null;
  const body = envelope ? String(envelope.html ?? "") : raw;
  if (!body || body.length > 4_000_000 || isTestEnvironment(body))
    throw new Error("capture_invalid_or_test");
  const canonicalTag = [...body.matchAll(/<link\b[^>]*>/gi)].find((m) =>
    /\brel=["']canonical["']/i.test(m[0]),
  )?.[0];
  const canonical = canonicalTag?.match(/\bhref=["']([^"']+)/i)?.[1];
  if (canonical && new URL(canonical, sourceUrl).href !== url.href)
    throw new Error("capture_url_mismatch");
  if (envelope && envelope.sourceUrl !== url.href)
    throw new Error("capture_url_mismatch");
  if (!canonical && !envelope) throw new Error("capture_exact_url_required");
  return { body, isCEC, registered };
}
