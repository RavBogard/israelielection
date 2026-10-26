import { fingerprint } from "./core";
let active = 0;
const queue: (() => void)[] = [];
async function acquireSlot() {
  if (active >= 8) {
    await new Promise<void>((resolve) => queue.push(resolve));
    return;
  }
  active++;
}
function releaseSlot() {
  const next = queue.shift();
  if (next) next();
  else active--;
}
import type { Authority, SourceHealth, SourceRef } from "./types";
export class PrimaryAcquisitionError extends Error {
  constructor(
    public code: string,
    public status: number | null = null,
    public sourceUrl: string | null = null,
  ) {
    super(code);
    this.name = "PrimaryAcquisitionError";
  }
}
export async function fetchPrimaryDetailed(
  url: string,
  allowedHosts: string[],
  deadline = Infinity,
) {
  const allowed = (value: string) => {
    const u = new URL(value);
    if (
      u.protocol !== "https:" ||
      !allowedHosts.includes(u.hostname) ||
      u.username ||
      u.password ||
      u.port
    )
      throw new PrimaryAcquisitionError("source_not_allowed", null, value);
    return u;
  };
  let current = allowed(url).href;
  const redirects: { from: string; to: string; status: number }[] = [];
  await acquireSlot();
  const budget = Math.min(deadline, Date.now() + 8000);
  try {
    for (let hop = 0; hop <= 3; hop++) {
      const remaining = budget - Date.now();
      if (remaining <= 0)
        throw new PrimaryAcquisitionError("acquisition_budget_expired");
      const r = await fetch(current, {
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(Math.max(1, remaining)),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; IsraeliElection lifecycle; +https://www.israelielection.org)",
        },
      });
      if ([301, 302, 303, 307, 308].includes(r.status)) {
        const location = r.headers.get("location");
        if (!location)
          throw new PrimaryAcquisitionError(
            "redirect_without_location",
            r.status,
            current,
          );
        const next = allowed(new URL(location, current).href).href;
        if (
          /maintenance|captcha|challenge|access.denied/i.test(
            new URL(next).pathname,
          )
        )
          throw new PrimaryAcquisitionError(
            "source_maintenance_or_challenge",
            r.status,
            next,
          );
        if (hop === 3 || redirects.some((x) => x.from === next))
          throw new PrimaryAcquisitionError("redirect_limit", r.status, next);
        redirects.push({ from: current, to: next, status: r.status });
        current = next;
        continue;
      }
      if (!r.ok)
        throw new PrimaryAcquisitionError(
          "source_http_error",
          r.status,
          current,
        );
      const body = await r.text();
      if (!body.trim())
        throw new PrimaryAcquisitionError("source_empty", r.status, current);
      if (body.length > 4000000)
        throw new PrimaryAcquisitionError(
          "source_oversized",
          r.status,
          current,
        );
      if (
        /sucuri_cloudproxy_js|enable javascript and cookies|checking your browser|cf-chl-|Incapsula incident ID/i.test(
          body,
        )
      )
        throw new PrimaryAcquisitionError(
          "source_maintenance_or_challenge",
          r.status,
          current,
        );
      return { body, url: current, redirects, status: r.status };
    }
    throw new PrimaryAcquisitionError("redirect_limit");
  } finally {
    releaseSlot();
  }
}
export async function fetchPrimary(
  url: string,
  allowedHosts: string[],
  deadline = Infinity,
) {
  return (await fetchPrimaryDetailed(url, allowedHosts, deadline)).body;
}
export const sourceRecord = (
  id: string,
  publisher: string,
  url: string,
  authority: Authority,
  body: string,
  now: string,
  title = publisher,
): SourceRef => ({
  id,
  publisher,
  title,
  url,
  authority,
  publishedAt: null,
  observedAt: now,
  captureHash: fingerprint(body),
});
export const healthRecord = (
  sourceId: string,
  authority: Authority,
  status: SourceHealth["status"],
  now: string,
  previous?: SourceHealth,
): SourceHealth => ({
  sourceId,
  authority,
  status,
  checkedAt: now,
  lastSuccessfulAt:
    status === "healthy" ? now : (previous?.lastSuccessfulAt ?? null),
  reason:
    status === "healthy" || status === "complete"
      ? null
      : status === "disputed"
        ? "source_conflict"
        : status === "invalid"
          ? "source_invalid"
          : "source_unavailable",
});
