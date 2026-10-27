import { beforeAll, afterAll, afterEach, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { PostgresPoliticalRecords, type SqlPool } from "./postgres";
import { makeRecord, makeSource } from "./records";
import {
  assessCommitment,
  validateRubric,
  type CommitmentRubric,
} from "./commitments";
import { buildGlobalProjection, loadGlobalProjection } from "./global-model";
import { ingestPromise, saveCommitment } from "./commitment-ingestion";
import {
  normalizeParliamentPage,
  storeParliamentContract,
  collectParliament,
  type ParliamentContract,
} from "./parliament";
import { collectCbs } from "./cbs";
const now = "2026-11-04T12:00:00Z",
  hash = "a".repeat(64),
  other = "b".repeat(64);
const rubric: CommitmentRubric = {
  version: "v1",
  commitmentId: "prices",
  metricId: "prices",
  scopeId: "IL",
  unit: "percent",
  baseline: { value: 2, observationRevisionId: hash, period: "2026-09" },
  target: { comparison: "lte", value: 1, tolerance: 0 },
  deadlineAt: "2026-12-31T00:00:00Z",
  assessmentPeriod: "2026-12",
  methodologyRevisionId: other,
};
const baseline = {
  revisionId: hash,
  metricId: "prices",
  scopeId: "IL",
  unit: "percent",
  value: 2,
  period: "2026-09",
  observedAt: now,
  qualified: true,
};
it("keeps missing rubrics and qualified baselines unassessable", () => {
  expect(assessCommitment(null, [], now).state).toBe("not_assessable");
  expect(assessCommitment(rubric, [], now).reason).toBe(
    "missing_qualified_baseline",
  );
  expect(() =>
    validateRubric({ ...rubric, assessmentPeriod: "2026-99" }),
  ).toThrow();
});
it("future deadlines are not yet due, never failures", () =>
  expect(assessCommitment(rubric, [baseline], now).state).toBe("not_yet_due"));
it("measures explicit targets without attributing causation", () => {
  const result = assessCommitment(
    rubric,
    [
      baseline,
      { ...baseline, revisionId: other, period: "2026-12", value: 0.9 },
    ],
    "2027-01-01T00:00:00Z",
  );
  expect(result.state).toBe("target_met");
  expect(result.causation).toBe("not_established");
});
it("refuses unit mismatches and conflicting observations", () => {
  const end = "2027-01-01T00:00:00Z",
    observation = {
      ...baseline,
      revisionId: other,
      period: "2026-12",
      value: 1,
    };
  expect(
    assessCommitment(rubric, [baseline, { ...observation, unit: "index" }], end)
      .state,
  ).toBe("not_assessable");
  expect(
    assessCommitment(
      rubric,
      [
        baseline,
        observation,
        { ...observation, revisionId: "c".repeat(64), value: 3 },
      ],
      end,
    ).state,
  ).toBe("mixed_evidence");
});
let db: PGlite, repository: PostgresPoliticalRecords;
beforeAll(async () => {
  db = new PGlite();
  for (const name of [
    "001-political-record.sql",
    "003-platform-workspaces.sql",
  ])
    await db.exec(await readFile(`db/${name}`, "utf8"));
  const pool: SqlPool = {
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
  repository = new PostgresPoliticalRecords(pool);
}, 30000);
afterAll(async () => {
  await db?.close();
});
afterEach(() => vi.unstubAllEnvs());
it("stores a primary own-party promise, preserves the unrated evidence chain and appends corrections", async () => {
  const input = {
    id: "housing",
    title: "Housing pledge",
    actorId: "likud",
    sourceId: "party-likud",
    url: "https://www.likud.org.il/test",
    quote: "We commit to publish the housing implementation programme.",
    body: "<p>We commit to publish the housing implementation programme.</p>",
    publishedAt: "2026-11-03T00:00:00Z",
  };
  // Registry source identity is discovered explicitly, never inferred from an unrelated publisher.
  const registry = await import("../../data/election-lifecycle-sources.json");
  input.sourceId = registry.default.sources.find(
    (source) =>
      source.authority === "party" &&
      (source.partyIds as string[]).includes("likud"),
  )!.id;
  const promise = await ingestPromise(repository, input, null, now);
  const record = await saveCommitment(
    repository,
    {
      commitmentId: "housing",
      title: input.title,
      actorIds: ["likud"],
      chain: [{ stage: "promise", recordRevisionId: promise.revisionId }],
    },
    now,
  );
  expect(
    (await saveCommitment(repository, record.payload as never, now)).revisionId,
  ).toBe(record.revisionId);
  const global = await loadGlobalProjection(repository, now);
  expect(global.commitments[0].assessment.state).toBe("not_assessable");
  expect(global.commitments[0].chainEvidence[0].qualified).toBe(true);
  await expect(
    ingestPromise(repository, { ...input, actorId: "shas" }, null, now),
  ).rejects.toThrow("promise_source_unqualified");
  const changed = await ingestPromise(
    repository,
    {
      ...input,
      quote: "We commit to publish a revised housing implementation programme.",
      body: "We commit to publish a revised housing implementation programme.",
    },
    null,
    "2026-11-05T00:00:00Z",
  );
  expect(changed.previousRevisionId).toBe(promise.revisionId);
});
it("loads actual recorded CBS shape globally, independent of the selected election", async () => {
  const body = await readFile(
    "lib/political-record/fixtures/cbs-price-120010.json",
    "utf8",
  );
  await collectCbs(
    repository,
    null,
    now,
    async () =>
      new Response(body, { headers: { "content-type": "application/json" } }),
  );
  const global = await loadGlobalProjection(repository, now);
  expect(global.indicators.length).toBe(2);
  expect(global.indicators[0].period).toBe("2026-09");
  expect(global.parliament.state).toBe("unavailable");
});
const membership = {
  termId: "27",
  personId: "person-1",
  personName: "Recorded person",
  partyId: null,
  role: "member",
  startedAt: now,
  endedAt: null,
  documentId: "doc-1",
};
const fields = Object.fromEntries(
  Object.keys(membership).map((key) => [key, { field: key }]),
);
const xml = `<edmx:Edmx><edmx:DataServices><Schema><EntityType Name="Member">${Object.keys(
  fields,
)
  .map((key) => `<Property Name="${key}" Type="Edm.String"/>`)
  .join("")}</EntityType></Schema></edmx:DataServices></edmx:Edmx>`;
const definition = {
  id: "test-members",
  version: "v1",
  kind: "parliamentary_membership" as const,
  entityName: "Members",
  entityType: "Member",
  dataUrl: "https://knesset.gov.il/OdataV4/ParliamentInfo/Members",
  fields,
  rehearsal: true,
  documentation: Object.keys(fields).map((key) => ({
    url: "https://knesset.gov.il/documentation",
    normalizedField: key,
    quote: `Official field ${key} documents this member attribute.`,
  })),
};
const document = definition.documentation.map((item) => item.quote).join(" ");
it("rejects HTTP200 maintenance as schema qualification", async () =>
  await expect(
    storeParliamentContract(
      repository,
      definition,
      null,
      now,
      async () => new Response("<html>geo maintenance</html>"),
    ),
  ).rejects.toThrow("metadata_unqualified"));
it("qualifies mapped fields from captured schema/docs, persists pagination and excludes rehearsal facts from public projection", async () => {
  const urls: string[] = [];
  const fetcher = async (url: RequestInfo | URL) => {
    const value = String(url);
    urls.push(value);
    if (value.endsWith("$metadata")) return new Response(xml);
    if (value.includes("documentation")) return new Response(document);
    return new Response(
      JSON.stringify({
        value: [membership],
        ...(value.includes("skip")
          ? {}
          : { "@odata.nextLink": definition.dataUrl + "?$skip=1" }),
      }),
      { headers: { "content-type": "application/json" } },
    );
  };
  const contract = await storeParliamentContract(
    repository,
    definition,
    null,
    now,
    fetcher,
  );
  expect(
    (await collectParliament(repository, contract.recordId, null, now, fetcher))
      .complete,
  ).toBe(false);
  expect(
    (
      await collectParliament(
        repository,
        contract.recordId,
        null,
        "2026-11-04T13:00:00Z",
        fetcher,
      )
    ).complete,
  ).toBe(true);
  expect(urls).toContain(definition.dataUrl + "?$skip=1");
  const global = await loadGlobalProjection(repository, now);
  expect(global.parliament.memberships).toEqual([]);
  vi.stubEnv("VERCEL_ENV", "production");
  await expect(
    collectParliament(repository, contract.recordId, null, now, fetcher),
  ).rejects.toThrow("rehearsal_forbidden");
});
it("rejects next-page origin/entity changes and invalid membership fields", () => {
  const contract = {
    ...definition,
    schemaHash: hash,
    semanticProofs: [],
  } as ParliamentContract;
  expect(() =>
    normalizeParliamentPage(
      { value: [{ ...membership, endedAt: "2020-01-01" }] },
      contract,
    ),
  ).toThrow();
  expect(() =>
    normalizeParliamentPage(
      { value: [], "@odata.nextLink": "https://knesset.gov.il/other" },
      contract,
    ),
  ).toThrow("next_page_unqualified");
});
it("arbitrary government records without qualified source contracts never assert an incumbent", () => {
  const source = makeSource({
    sourceId: "knesset",
    url: "https://knesset.gov.il/test",
    authority: "knesset",
    publisher: "Knesset",
    title: "Test",
    captureHash: hash,
    observedAt: now,
    publishedAt: now,
  });
  const record = makeRecord({
    recordId: "fake-government",
    kind: "government",
    electionId: null,
    observedAt: now,
    effectiveAt: now,
    status: "confirmed",
    evidenceClass: "primary_confirmed",
    previousRevisionId: null,
    payload: { governmentId: "gov", title: "Example", state: "formed" },
    provenance: {
      sourceIds: [source.revisionId],
      captureIds: [],
      parserVersion: "unknown",
    },
  });
  expect(
    buildGlobalProjection([record], [source], now, "1", true).incumbent.state,
  ).toBe("unknown");
});

it("accepts a documented synthetic normalized membership only through the qualified contract path", async () => {
  const fetcher: typeof fetch = async (input) =>
    String(input).endsWith("$metadata")
      ? new Response(xml)
      : String(input).includes("documentation")
        ? new Response(document)
        : new Response(JSON.stringify({ value: [membership] }), {
            headers: { "content-type": "application/json" },
          });
  const contract = await storeParliamentContract(
    repository,
    { ...definition, id: "qualified-test-members", rehearsal: false },
    null,
    now,
    fetcher,
  );
  await collectParliament(repository, contract.recordId, null, now, fetcher);
  const projection = await loadGlobalProjection(repository, now);
  expect(projection.parliament.memberships[0]).toMatchObject({
    personId: "person-1",
    partyId: null,
    termId: "27",
    captureState: "missing",
  });
  expect(projection.parliament.memberships[0].sources[0].authority).toBe(
    "knesset",
  );
});
