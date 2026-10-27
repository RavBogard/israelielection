import { beforeAll, afterAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { PostgresPoliticalRecords, type SqlPool } from "./postgres";
import { collectCbs } from "./cbs";
import { makeRecord, makeCapture } from "./records";
import { recordHash } from "./hash";
import { contentHash, type CaptureArchive } from "./captures";
import {
  storeReviewedPublicationEdition,
  projectPublication,
  type IndependentReview,
} from "./publications";
import { EMAIL_LOCALES } from "./email";
import { projectPublic } from "./public-projection";
const now = "2026-11-04T12:00:00Z";
let db: PGlite,
  repo: PostgresPoliticalRecords,
  fact: Awaited<ReturnType<typeof makeRecord>>,
  publication: Awaited<ReturnType<typeof makeRecord>>;
const bodies = new Map<string, Uint8Array>();
const archive: CaptureArchive = {
  put: async (source, body, mediaType) => {
    const hash = contentHash(body);
    bodies.set(hash, body);
    return makeCapture({
      contentSha256: hash,
      sourceRevisionId: source.revisionId,
      storageKey: `private/${hash}`,
      mediaType,
      byteLength: body.length,
      observedAt: now,
    });
  },
  read: async (ref) => bodies.get(ref.contentSha256)!,
};
const content = {
  subject: "Recorded index observation",
  text: "This synthetic publication describes a recorded index, without causal attribution.",
};
const review = (locale: (typeof EMAIL_LOCALES)[number]): IndependentReview => ({
  decision: "approve",
  publicationRevisionId: publication.revisionId,
  locale,
  contentHash: recordHash(content),
  factRevisionIds: [fact.revisionId],
  generationRunId: "generation-fixture",
  reviewRunId: "independent-fixture",
  provider: "fixture",
  model: "fixture",
});
beforeAll(async () => {
  db = new PGlite();
  for (const name of [
    "001-political-record.sql",
    "002-subscriptions.sql",
    "003-platform-workspaces.sql",
    "004-distribution.sql",
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
  repo = new PostgresPoliticalRecords(pool);
  const raw = await readFile(
    "lib/political-record/fixtures/cbs-price-120010.json",
    "utf8",
  );
  await collectCbs(
    repo,
    archive,
    now,
    async () =>
      new Response(raw, { headers: { "content-type": "application/json" } }),
  );
  fact = (
    await repo.latest({ kind: "indicator_observation", globalOnly: true })
  ).records[0];
  publication = makeRecord({
    recordId: "publication:review-fixture",
    kind: "publication",
    electionId: "il-knesset-26",
    effectiveAt: null,
    observedAt: now,
    status: "confirmed",
    evidenceClass: "model_output",
    previousRevisionId: null,
    payload: {
      category: "fact_change",
      recordRevisionIds: [fact.revisionId],
      titleKey: "index_observation",
      data: { topics: ["policies"], delivery: "major_event" },
    },
    provenance: {
      sourceIds: fact.provenance.sourceIds,
      captureIds: [],
      parserVersion: "source-analysis-v1",
    },
  });
  await repo.append({
    records: [publication],
    sources: [],
    captures: [],
    outbox: [],
  });
}, 30000);
afterAll(async () => await db?.close());
it("requires private capture, independent exact-content review and current qualified evidence", async () => {
  await expect(
    storeReviewedPublicationEdition(
      repo,
      publication.revisionId,
      "en",
      content,
      review("en"),
      null,
      now,
    ),
  ).rejects.toThrow("private_archive_required");
  await expect(
    storeReviewedPublicationEdition(
      repo,
      publication.revisionId,
      "en",
      content,
      { ...review("en"), reviewRunId: "generation-fixture" },
      archive,
      now,
    ),
  ).rejects.toThrow("review_unqualified");
  await expect(
    storeReviewedPublicationEdition(
      repo,
      publication.revisionId,
      "en",
      content,
      { ...review("en"), contentHash: "a".repeat(64) },
      archive,
      now,
    ),
  ).rejects.toThrow("review_unqualified");
  await expect(
    storeReviewedPublicationEdition(
      repo,
      publication.revisionId,
      "en",
      content,
      review("en"),
      archive,
      now,
      async () => false,
    ),
  ).rejects.toThrow("evidence_unavailable");
});
it("a good edition publishes alone while missing translations remain unavailable", async () => {
  await storeReviewedPublicationEdition(
    repo,
    publication.revisionId,
    "en",
    content,
    review("en"),
    archive,
    now,
  );
  expect(
    (await projectPublication(repo, publication, "en", now, "latest")).payload
      .currentTextUnavailable,
  ).toBe(false);
  expect(
    (await projectPublication(repo, publication, "he", now, "latest")).payload
      .currentTextUnavailable,
  ).toBe(true);
});
it("all seven editions bind the same exact source/publication revision and discard private fields", async () => {
  for (const locale of EMAIL_LOCALES) {
    await storeReviewedPublicationEdition(
      repo,
      publication.revisionId,
      locale,
      { ...content, privateProviderKey: "do-not-export" },
      review(locale),
      archive,
      now,
    );
    const result = await projectPublication(
      repo,
      publication,
      locale,
      now,
      "latest",
    );
    const exported = projectPublic(result);
    expect(JSON.stringify(exported)).toContain(content.text);
    expect(JSON.stringify(exported)).not.toMatch(
      /privateProviderKey|do-not-export|generation-fixture|private\//,
    );
    expect(result.payload.locale).toBe(locale);
  }
});
it("source loss immediately withholds current text while preserving verified historical text", async () => {
  expect(
    (
      await projectPublication(
        repo,
        publication,
        "en",
        now,
        "latest",
        async () => false,
      )
    ).payload.currentTextUnavailable,
  ).toBe(true);
  expect(
    (
      await projectPublication(
        repo,
        publication,
        "en",
        now,
        "history",
        async () => false,
      )
    ).payload.currentTextUnavailable,
  ).toBe(false);
});
it("dependency withdrawal suppresses current text and labels the retained historical publication", async () => {
  const withdrawn = makeRecord({
    ...fact,
    status: "withdrawn",
    observedAt: "2026-11-05T00:00:00Z",
    previousRevisionId: fact.revisionId,
  });
  await repo.append({
    records: [withdrawn],
    sources: [],
    captures: [],
    outbox: [],
  });
  expect(
    (await projectPublication(repo, publication, "en", now, "latest")).payload
      .currentTextUnavailable,
  ).toBe(true);
  const historical = await projectPublication(
    repo,
    publication,
    "en",
    now,
    "history",
  );
  expect(historical.historicalState).toBe("dependency_withdrawn");
  expect(historical.currentState).toBe(false);
  expect(historical.payload.currentTextUnavailable).toBe(false);
});
