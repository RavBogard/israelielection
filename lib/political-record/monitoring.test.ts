import { renderedChecks } from "./render-monitor";
import sourceRegistry from "../../data/election-lifecycle-sources.json";
import { afterEach, beforeAll, afterAll, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import fixture from "./fixtures/globalping-public-2026-10-26.json";
import { classifyPublicProbe, checkPublicRegions } from "./globalping";
import {
  boundedReadRetry,
  safeCheck,
  type MonitorReport,
  type MonitorCheck,
} from "./monitor-types";
import { sourceAvailabilityChecks, groupedWarnings } from "./monitor-sources";
import { publicStoredSourceChecks } from "./monitor-public-sources";
import { emptyLedger } from "../election-lifecycle/resolver";
import type { PoliticalEvent } from "../election-lifecycle/types";
import { IncidentStore } from "./incidents";
import type { SqlPool } from "./postgres";
const now = "2026-10-28T06:01:00Z";
afterEach(() => vi.unstubAllEnvs());
it("accepts actual redacted US/DE public TLS responses and verifies the real IL locale redirect", () => {
  for (const country of ["US", "DE"]) {
    const row = fixture.primary.results.find(
      (row) => row.probe.country === country,
    )!;
    expect(
      classifyPublicProbe(row, country, now, [fixture.primary.id]).state,
    ).toBe("healthy_no_new");
  }
  const israel = fixture.primary.results.find(
    (row) => row.probe.country === "IL",
  )!;
  expect(
    classifyPublicProbe(israel, "IL", now, [fixture.primary.id]).state,
  ).toBe("unknown");
  expect(
    classifyPublicProbe(
      israel,
      "IL",
      now,
      [fixture.primary.id, fixture.followup.id],
      fixture.followup.results[0],
    ).reasonCode,
  ).toBe("locale_redirect_verified");
});
it("never calls missing locations healthy or follows external/unbounded redirects", () => {
  const row = fixture.primary.results[0];
  expect(classifyPublicProbe(row, "IL", now, []).reasonCode).toBe(
    "requested_region_unavailable",
  );
  expect(
    classifyPublicProbe(
      {
        ...row,
        result: {
          ...row.result,
          statusCode: 307,
          headers: { location: "https://attacker.example/he" },
        },
      },
      "US",
      now,
      [],
    ).reasonCode,
  ).toBe("unexpected_redirect");
  expect(
    classifyPublicProbe(
      { ...row, result: { ...row.result, tls: { authorized: false } } },
      "US",
      now,
      [],
    ).state,
  ).toBe("unavailable");
});
it("uses only fixed public measurement fields, no secrets/headers, and recovers within a three-attempt bound", async () => {
  vi.stubEnv("PLATFORM_MONITOR_PREVIEW_BYPASS", "sensitive-fixture-token");
  let creates = 0;
  const requests: { url: string; body?: string }[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    requests.push({
      url,
      body: typeof init?.body === "string" ? init.body : undefined,
    });
    if (init?.method === "POST") {
      creates++;
      if (creates === 1) return new Response("unavailable", { status: 503 });
      return Response.json({ id: fixture.primary.id }, { status: 202 });
    }
    return Response.json({
      ...fixture.primary,
      results: fixture.primary.results.filter(
        (row) => row.probe.country !== "IL",
      ),
    });
  };
  const checks = await checkPublicRegions(now, fetcher, async () => {});
  expect(creates).toBe(2);
  expect(checks.find((row) => row.id === "public:US")?.attempts).toBe(2);
  expect(checks.find((row) => row.id === "public:IL")?.state).toBe("unknown");
  expect(JSON.stringify(requests)).not.toMatch(
    /sensitive-fixture-token|protection-bypass|Authorization/,
  );
  expect(
    JSON.parse(requests.find((request) => request.body)!.body!).target,
  ).toBe("www.israelielection.org");
});
it("bounded recovery never becomes an unbounded retry or destructive operation", async () => {
  let attempts = 0;
  const result = await boundedReadRetry(
    async () => {
      attempts++;
      throw new Error("private provider text");
    },
    () => true,
    async () => {},
  );
  expect(attempts).toBe(3);
  expect(result).toMatchObject({ attempts: 3, recovered: false });
});
it("distinguishes absent configuration, checked-no-new, stale and disputed sources", () => {
  const ledger = emptyLedger();
  ledger.health = [
    {
      sourceId: "party-likud",
      authority: "party",
      status: "healthy",
      checkedAt: "2026-10-28T06:00:00Z",
      lastSuccessfulAt: "2026-10-28T06:00:00Z",
      reason: null,
    },
  ];
  const source = sourceRegistry.sources.find((source) =>
    (source.partyIds as string[]).includes("likud"),
  )!;
  ledger.health[0].sourceId = source.id;
  expect(
    sourceAvailabilityChecks(ledger, now, true).find((row) =>
      row.subjects.includes(source.id),
    )?.state,
  ).toBe("healthy_no_new");
  expect(
    sourceAvailabilityChecks(ledger, "2026-10-28T09:06:00Z", true).find((row) =>
      row.subjects.includes(source.id),
    )?.state,
  ).toBe("stale");
  ledger.health[0].status = "disputed";
  expect(
    sourceAvailabilityChecks(ledger, now, true).find((row) =>
      row.subjects.includes(source.id),
    )?.state,
  ).toBe("disputed");
  expect(
    sourceAvailabilityChecks(ledger, now, false).find((row) =>
      row.subjects.includes(source.id),
    )?.state,
  ).toBe("unconfigured");
  expect(
    groupedWarnings(sourceAvailabilityChecks(ledger, now, false)).some(
      (group) => group.count > 1,
    ),
  ).toBe(true);
});
it("historic failed articles stop affecting coverage after supersession, while active/pending failures remain", () => {
  const source = sourceRegistry.sources.find((row) =>
    (row.partyIds as string[]).includes("likud"),
  )!;
  const ledger = emptyLedger();
  const ref = {
    id: `${source.id}:old`,
    publisher: "Party",
    title: "Statement",
    url: "https://www.likud.org.il/old",
    authority: "party" as const,
    publishedAt: now,
    observedAt: now,
    captureHash: "a".repeat(64),
  };
  ledger.health = [
    {
      sourceId: source.id,
      authority: "party",
      status: "healthy",
      checkedAt: now,
      lastSuccessfulAt: now,
      reason: null,
    },
    {
      sourceId: ref.id,
      authority: "party",
      status: "unavailable",
      checkedAt: now,
      lastSuccessfulAt: null,
      reason: "source_unavailable",
    },
  ];
  ledger.events = [
    { id: "old", status: "superseded", sources: [ref] } as PoliticalEvent,
  ];
  const state = () =>
    sourceAvailabilityChecks(ledger, now, true).find((row) =>
      row.subjects.includes(source.id),
    )?.state;
  expect(state()).toBe("healthy_no_new");
  ledger.events[0].status = "confirmed";
  expect(state()).toBe("unavailable");
  ledger.events[0].status = "retracted";
  ledger.extractionPending = [ref.id];
  expect(state()).toBe("unavailable");
});
it("CI source signal reads only stored public status and exports no response/body/provider details", async () => {
  const requests: string[] = [];
  const checks = await publicStoredSourceChecks(now, async (input) => {
    requests.push(String(input));
    return new Response("private-like response diagnostics", { status: 503 });
  });
  expect(requests).toEqual([
    "https://www.israelielection.org/api/election-lifecycle",
  ]);
  expect(checks[0].state).toBe("unavailable");
  expect(JSON.stringify(checks)).not.toContain("private-like");
});
it("server-computed source summary retains a hidden current article failure without exposing its claim", async () => {
  const source = sourceRegistry.sources.find((row) =>
    (row.partyIds as string[]).includes("likud"),
  )!;
  const ledger = emptyLedger();
  const ref = {
    id: `${source.id}:hidden`,
    publisher: "Party",
    title: "Statement",
    url: "https://www.likud.org.il/hidden",
    authority: "party" as const,
    publishedAt: now,
    observedAt: now,
    captureHash: "a".repeat(64),
  };
  ledger.events = [
    {
      id: "private-hidden-event",
      status: "confirmed",
      sources: [ref],
    } as PoliticalEvent,
  ];
  ledger.health = [
    {
      sourceId: source.id,
      authority: "party",
      status: "healthy",
      checkedAt: now,
      lastSuccessfulAt: now,
      reason: null,
    },
    {
      sourceId: ref.id,
      authority: "party",
      status: "unavailable",
      checkedAt: now,
      lastSuccessfulAt: null,
      reason: "source_unavailable",
      diagnostic: {
        stage: "extraction",
        code: "provider_billing",
        httpStatus: 402,
        providerStatus: "RESOURCE_EXHAUSTED",
      },
    },
  ];
  const fetcher = async () =>
    Response.json({
      schemaVersion: 1,
      politics: { events: [] },
      sourceChecks: sourceAvailabilityChecks(ledger, now, true),
    });
  expect(
    (await publicStoredSourceChecks(now, fetcher)).find((row) =>
      row.subjects.includes(source.id),
    ),
  ).toMatchObject({ state: "unavailable", reasonCode: "provider_billing" });
  ledger.events[0].status = "superseded";
  expect(
    (await publicStoredSourceChecks(now, fetcher)).find((row) =>
      row.subjects.includes(source.id),
    )?.state,
  ).toBe("healthy_no_new");
  ledger.extractionPending = [ref.id];
  const checks = await publicStoredSourceChecks(now, fetcher);
  expect(checks.find((row) => row.subjects.includes(source.id))?.state).toBe(
    "unavailable",
  );
  expect(JSON.stringify(checks)).not.toMatch(
    /private-hidden-event|likud.org.il/,
  );
});
let db: PGlite, store: IncidentStore, pool: SqlPool;
beforeAll(async () => {
  db = new PGlite();
  for (const name of [
    "001-political-record.sql",
    "002-subscriptions.sql",
    "005-operations.sql",
  ])
    await db.exec(await readFile(`db/${name}`, "utf8"));
  pool = {
    connect: async () => ({
      query: async (text, values) => {
        if (text.includes("pg_advisory_xact_lock"))
          return { rows: [], rowCount: 1 };
        const result = await db.query<Record<string, unknown>>(text, values);
        return { rows: result.rows, rowCount: result.affectedRows ?? 0 };
      },
      release() {},
    }),
    end: async () => {},
  };
  store = new IncidentStore(pool);
}, 30000);
afterAll(async () => await db?.close());
const report = (runId: string, check: MonitorCheck): MonitorReport => ({
  schemaVersion: 1,
  runId,
  checkedAt: check.checkedAt,
  checks: [check],
  recovery: {
    policy: "bounded_read_only_retry",
    maxAttempts: 3,
    destructiveActions: false,
    messagesSent: false,
  },
});
const base: MonitorCheck = {
  id: "public:US",
  scope: "reachability",
  state: "healthy_no_new",
  checkedAt: now,
  reasonCode: "http_tls_pass",
  attempts: 1,
  subjects: ["country:US"],
};
it("stores private check state, deduplicates incidents, retains last confirmed health and appends resolution history", async () => {
  await store.record(report("healthy-first", base));
  const failed = {
    ...base,
    state: "unavailable" as const,
    reasonCode: "http_status_failed",
    checkedAt: "2026-10-28T06:02:00Z",
  };
  expect((await store.record(report("failed-one", failed))).transitions).toBe(
    1,
  );
  expect((await store.record(report("failed-one", failed))).observations).toBe(
    0,
  );
  expect(
    (
      await store.record(
        report("failed-two", { ...failed, checkedAt: "2026-10-28T06:03:00Z" }),
      )
    ).transitions,
  ).toBe(0);
  let status = await store.status();
  expect(status.incidents[0]).toMatchObject({
    state: "open",
    failures: 2,
    lastConfirmedHealthyAt: "2026-10-28T06:01:00.000Z",
  });
  await store.record(
    report("recovered", {
      ...base,
      checkedAt: "2026-10-28T06:04:00Z",
      attempts: 2,
    }),
  );
  status = await store.status();
  expect(status.incidents[0].state).toBe("resolved");
  await store.record(report("late-old-failure", failed));
  expect((await store.status()).incidents[0].state).toBe("resolved");
  await expect(
    db.exec("DELETE FROM political_private.operation_incident_events"),
  ).rejects.toThrow();
});
it("allows only safe categorical diagnostic fields, never raw errors/captures or contacts", () => {
  const safe = safeCheck({
    ...base,
    rawBody: "private body",
    email: "private@example.org",
  } as MonitorCheck);
  expect(JSON.stringify(safe)).not.toMatch(/private body|private@example/);
  expect(() =>
    safeCheck({ ...base, reasonCode: "raw provider error with secret" }),
  ).toThrow("invalid");
});

it("render summaries retain only categorical proof and missing editions remain unknown", () => {
  const checks = renderedChecks(
    {
      suites: [
        {
          specs: [
            {
              title: "render he homepage and stored-state tools",
              tests: [
                {
                  results: [
                    {
                      status: "failed",
                      error: { message: "private browser headers" },
                    },
                    { status: "passed" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    now,
  );
  expect(checks.find((check) => check.id === "render:he")).toMatchObject({
    state: "healthy_no_new",
    attempts: 2,
  });
  expect(checks.find((check) => check.id === "render:ar")?.state).toBe(
    "unknown",
  );
  expect(JSON.stringify(checks)).not.toContain("private browser headers");
});

it("isolates preview incidents and receipts from production/development checks", async () => {
  const preview = new IncidentStore(pool, "preview");
  await preview.record(
    report("preview-failure", {
      ...base,
      state: "unavailable",
      reasonCode: "http_status_failed",
    }),
  );
  expect((await preview.status()).incidents[0].state).toBe("open");
  expect((await store.status()).incidents[0].state).toBe("resolved");
  await expect(
    db.exec("TRUNCATE political_private.operation_incident_events"),
  ).rejects.toThrow();
  await db.exec(await readFile("db/005-operations.sql", "utf8"));
});

it("a legitimately empty pre-close acquisition namespace is not a site outage", () => {
  expect(
    sourceAvailabilityChecks(null, "2026-10-26T20:00:00Z", true)[0],
  ).toMatchObject({ state: "unknown", reasonCode: "acquisition_not_due" });
  expect(
    sourceAvailabilityChecks(null, "2026-10-28T20:00:00Z", true)[0].state,
  ).toBe("unavailable");
});
