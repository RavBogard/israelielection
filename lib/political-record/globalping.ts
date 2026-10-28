import { boundedReadRetry } from "./monitor-types";
import type { MonitorCheck } from "./monitor-types";
export const PUBLIC_MONITOR_ORIGIN = "https://www.israelvotes.org";
const API = "https://api.globalping.io/v1/measurements";
const COUNTRIES = ["US", "DE", "IL"] as const;
type ProbeRow = {
  probe?: { country?: unknown; city?: unknown };
  result?: {
    status?: unknown;
    statusCode?: unknown;
    headers?: Record<string, unknown>;
    tls?: { authorized?: unknown };
  };
};
type Measurement = {
  id: string;
  status: string;
  target?: string;
  results?: ProbeRow[];
};
function redirectPath(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const next = new URL(value, PUBLIC_MONITOR_ORIGIN);
    return next.origin === PUBLIC_MONITOR_ORIGIN &&
      !next.username &&
      !next.password &&
      !next.search &&
      !next.hash &&
      /^\/(?:he|ar|fa|de|fr|zh)\/?$/.test(next.pathname)
      ? next.pathname
      : null;
  } catch {
    return null;
  }
}
function location(row: ProbeRow) {
  return typeof row.probe?.country === "string" &&
    typeof row.probe?.city === "string"
    ? { country: row.probe.country, city: row.probe.city }
    : null;
}
export function classifyPublicProbe(
  row: ProbeRow,
  requestedCountry: string,
  now: string,
  ids: string[],
  followed?: ProbeRow,
): MonitorCheck {
  const actual = location(row),
    result = row.result,
    base = {
      id: `public:${requestedCountry}`,
      scope: "reachability" as const,
      checkedAt: now,
      attempts: 1,
      subjects: [`country:${requestedCountry}`],
      measurementIds: ids,
      ...(actual ? { location: actual } : {}),
    };
  if (!actual || actual.country !== requestedCountry)
    return {
      ...base,
      state: "unknown",
      reasonCode: "requested_region_unavailable",
    };
  if (result?.status === "failed")
    return {
      ...base,
      state: "unavailable",
      reasonCode: "probe_network_failed",
    };
  if (result?.status !== "finished")
    return { ...base, state: "unknown", reasonCode: "probe_incomplete" };
  if (result.tls?.authorized !== true)
    return {
      ...base,
      state: "unavailable",
      reasonCode: "tls_not_authorized",
      tlsAuthorized: result.tls?.authorized === false ? false : null,
    };
  const status =
    typeof result.statusCode === "number" ? result.statusCode : null;
  if (status === 200)
    return {
      ...base,
      state: "healthy_no_new",
      reasonCode: "http_tls_pass",
      httpStatus: status,
      tlsAuthorized: true,
    };
  if (status && [301, 302, 303, 307, 308].includes(status)) {
    const target = redirectPath(
      result.headers?.location ?? result.headers?.Location,
    );
    if (!target)
      return {
        ...base,
        state: "unavailable",
        reasonCode: "unexpected_redirect",
        httpStatus: status,
        tlsAuthorized: true,
      };
    const followLocation = followed ? location(followed) : null;
    if (
      !followed ||
      !followLocation ||
      followLocation.country !== requestedCountry
    )
      return {
        ...base,
        state: "unknown",
        reasonCode: "locale_redirect_unverified",
        httpStatus: status,
        tlsAuthorized: true,
      };
    if (
      followed.result?.status === "finished" &&
      followed.result.statusCode === 200 &&
      followed.result.tls?.authorized === true
    )
      return {
        ...base,
        state: "healthy_no_new",
        reasonCode: "locale_redirect_verified",
        httpStatus: 200,
        tlsAuthorized: true,
        location: followLocation,
      };
    return {
      ...base,
      state: followed.result?.status === "finished" ? "unavailable" : "unknown",
      reasonCode: "locale_redirect_failed",
      httpStatus:
        typeof followed.result?.statusCode === "number"
          ? followed.result.statusCode
          : null,
      tlsAuthorized: followed.result?.tls?.authorized === true,
    };
  }
  return {
    ...base,
    state: "unavailable",
    reasonCode: "http_status_failed",
    httpStatus: status,
    tlsAuthorized: true,
  };
}
async function measure(
  path: string,
  countries: readonly string[],
  fetcher: typeof fetch,
  wait: (ms: number) => Promise<void>,
): Promise<Measurement> {
  // Fixed public host/path and no optional request headers: never send keys, cookies or preview bypass to public probes.
  if (path !== "/" && !/^\/(?:he|ar|fa|de|fr|zh)\/?$/.test(path))
    throw new Error("monitor_path_invalid");
  const response = await fetcher(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "http",
      target: new URL(PUBLIC_MONITOR_ORIGIN).hostname,
      locations: countries.map((country) => ({ country, limit: 1 })),
      timeout: 10,
      measurementOptions: {
        protocol: "HTTPS",
        request: { path, method: "GET" },
      },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (response.status !== 202 && response.status !== 200)
    throw new Error("public_probe_unavailable");
  const created = (await response.json()) as { id?: unknown };
  if (typeof created.id !== "string" || !/^[a-zA-Z0-9]{8,80}$/.test(created.id))
    throw new Error("public_probe_id_invalid");
  let measurement: Measurement = { id: created.id, status: "in-progress" };
  for (let n = 0; n < 8; n++) {
    await wait(750);
    const result = await fetcher(`${API}/${created.id}`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!result.ok) throw new Error("public_probe_unavailable");
    measurement = (await result.json()) as Measurement;
    if (
      measurement.id !== created.id ||
      measurement.target !== new URL(PUBLIC_MONITOR_ORIGIN).hostname
    )
      throw new Error("public_probe_result_invalid");
    if (measurement.status === "finished") return measurement;
  }
  return measurement;
}
export async function checkPublicRegions(
  now: string,
  fetcher: typeof fetch = fetch,
  wait: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms)),
) {
  const initial = await boundedReadRetry(
      () => measure("/", COUNTRIES, fetcher, wait),
      (value) => value.status === "finished",
      wait,
    ),
    first = initial.value;
  if (!first)
    return COUNTRIES.map((country) => ({
      id: `public:${country}`,
      scope: "reachability" as const,
      state: "unknown" as const,
      checkedAt: now,
      reasonCode: "probe_provider_unavailable",
      attempts: initial.attempts,
      subjects: [`country:${country}`],
    }));
  const checks: MonitorCheck[] = [];
  for (const country of COUNTRIES) {
    const row =
      first.results?.find((row) => row.probe?.country === country) ?? {};
    const path = redirectPath(
      row.result?.headers?.location ?? row.result?.headers?.Location,
    );
    let second: Measurement | undefined,
      attempts = initial.attempts;
    if (path) {
      const follow = await boundedReadRetry(
        () => measure(path, [country], fetcher, wait),
        (value) => value.status === "finished",
        wait,
      );
      second = follow.value;
      attempts = Math.max(attempts, follow.attempts);
    }
    checks.push({
      ...classifyPublicProbe(
        row,
        country,
        now,
        [first.id, ...(second ? [second.id] : [])],
        second?.results?.find((row) => row.probe?.country === country),
      ),
      attempts,
    });
  }
  return checks;
}
