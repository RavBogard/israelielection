import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { PostgresPoliticalRecords, type SqlPool } from "./postgres";
import { contentHash, type CaptureArchive } from "./captures";
import { makeCapture, makeRecord } from "./records";
import { promoteReviewedBriefing, replayBriefing } from "./reporting";
import {
  runPublicationStage,
  producerModel,
  queueReviewedBriefing,
  registerLivePublicationInputs,
  discoverPublicationJobs,
  recoverPublicationJob,
} from "./producer";
import { projectPublication } from "./publications";
import { projectPublic } from "./public-projection";
import { collectCbs } from "./cbs";
import {
  claimHash,
  publicClaimEvidence,
  sentenceHash,
  type CapturedArticle,
  type AtomicClaim,
} from "../briefing-verified";
import type { Briefing } from "../briefing";
import type { BriefingEvidenceBundle } from "../briefing-archive";
const now = "2026-11-04T12:00:00.000Z";
let db: PGlite, repo: PostgresPoliticalRecords;
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
      observedAt: source.observedAt,
    });
  },
  read: async (ref) => {
    const body = bodies.get(ref.contentSha256);
    if (!body) throw Error("capture_unavailable");
    return body;
  },
  readHash: async (hash) => {
    const body = bodies.get(hash);
    if (!body) throw Error("capture_unavailable");
    return body;
  },
};
function fixture(
  text = "The committee said the proposal has not been adopted.",
  generatedAt = now,
) {
  const article: CapturedArticle = {
    body:
      text +
      " This article reports a committee statement and makes no prediction.",
    bodyHash: "",
    capturedAt: now,
    origin: { id: "jpost", kind: "newsroom", byline: "Reporter" },
    summary: "Public fixture summary",
    outlet: "Jerusalem Post",
    title: "Committee statement",
    url: "https://www.jpost.com/article/123",
    published: now,
  };
  article.bodyHash = sentenceHash(article.body);
  const claim: AtomicClaim = {
    id: "statement",
    text,
    kind: "attributed_perspective",
    citations: [{ source: 1, quote: text }],
  };
  const bundle: BriefingEvidenceBundle = {
    date: "2026-11-04",
    model: "actual-pipeline-fixture",
    articles: [article],
    claims: [claim],
    review: [
      {
        id: claim.id,
        supported: true,
        atomic: true,
        attributionPreserved: true,
        noAddedInference: true,
      },
    ],
    translations: [
      {
        locale: "he",
        model: "translation-fixture",
        sentences: [
          {
            id: claim.id,
            text: "הוועדה מסרה שההצעה טרם אומצה.",
            sourceHash: sentenceHash(text),
          },
        ],
        review: [
          {
            id: claim.id,
            supported: true,
            complete: true,
            attributionPreserved: true,
          },
        ],
      },
    ],
  };
  const bytes = Buffer.from(JSON.stringify(bundle)),
    hash = contentHash(bytes);
  bodies.set(hash, bytes);
  const briefing: Briefing = {
    date: bundle.date,
    generatedAt,
    model: bundle.model,
    evidenceVersion: 2,
    capture: { state: "archived", privateStored: true, captureHash: hash },
    verification: {
      model: bundle.model,
      reviewedAt: now,
      claims: [
        {
          id: claim.id,
          contentHash: claimHash(claim),
          supported: true,
          atomic: true,
          attributionPreserved: true,
          noAddedInference: true,
        },
      ],
    },
    sentences: [
      {
        text,
        claimId: claim.id,
        kind: claim.kind,
        sourceHash: sentenceHash(text),
        evidenceClass: "attributed_perspective",
        sources: [
          {
            outlet: article.outlet,
            title: article.title,
            url: article.url,
            published: article.published,
          },
        ],
        evidence: publicClaimEvidence(claim, [article]),
        translations: {
          he: {
            text: bundle.translations![0].sentences[0].text,
            sourceHash: sentenceHash(text),
            model: "translation-fixture",
            reviewed: true,
          },
        },
      },
    ],
    dropped: [],
  };
  return { briefing, bundle, hash };
}
beforeAll(async () => {
  db = new PGlite();
  for (const name of [
    "001-political-record.sql",
    "002-subscriptions.sql",
    "003-platform-workspaces.sql",
    "004-distribution.sql",
    "006-publication-evidence.sql",
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
}, 30000);
afterAll(async () => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  await db.close();
});
it("requires actual private hash lookup and rejects altered public sentence/review", async () => {
  const { briefing } = fixture();
  await expect(
    replayBriefing(briefing, { ...archive, readHash: undefined }),
  ).rejects.toThrow("briefing_private_bundle_required");
  const changed = structuredClone(briefing);
  changed.sentences[0].text = "The committee adopted the proposal.";
  await expect(replayBriefing(changed, archive)).rejects.toThrow(
    "briefing_sentence_mismatch",
  );
  const { bundle } = fixture();
  bundle.review[0].supported = false;
  const bytes = Buffer.from(JSON.stringify(bundle));
  bodies.set(contentHash(bytes), bytes);
  briefing.capture!.captureHash = contentHash(bytes);
  await expect(replayBriefing(briefing, archive)).rejects.toThrow(
    "atomic_semantic_review_rejected",
  );
});
it("publishes each independently archived locale and omits unproved public translations", async () => {
  const { briefing } = fixture();
  briefing.sentences[0].translations!.fr = {
    text: "Texte non archivé",
    sourceHash: briefing.sentences[0].sourceHash!,
    model: "fixture",
    reviewed: true,
  };
  expect((await replayBriefing(briefing, archive)).locales.size).toBe(2);
  const result = await promoteReviewedBriefing(repo, archive, briefing);
  expect(result.locales).toEqual(["en", "he"]);
  const publication = (await repo.getRevision(result.revision))!;
  const projected = await projectPublication(
    repo,
    publication,
    "en",
    now,
    "latest",
  );
  const safe = JSON.stringify(projectPublic(projected));
  expect(safe).toContain("attributed_analysis");
  expect(safe).not.toContain("reported_corroborated");
  expect(projected.evidenceClass).toBe("attributed_analysis");
  expect(safe).not.toContain("primary_confirmed");
  expect(safe).not.toContain("quoteHash");
  expect(safe).not.toContain("storageKey");
  expect(projected.payload.currentTextUnavailable).toBe(false);
  expect(
    (await projectPublication(repo, publication, "fr", now, "latest")).payload
      .currentTextUnavailable,
  ).toBe(true);
});
it("replaying identical digest cannot create a second revision, edition or outbox", async () => {
  const { briefing } = fixture();
  const first = await promoteReviewedBriefing(repo, archive, briefing);
  const count = await db.query<{ n: number }>(
    "SELECT count(*)::int n FROM political_record.outbox_intents",
  );
  expect(
    (await promoteReviewedBriefing(repo, archive, briefing)).revision,
  ).toBe(first.revision);
  expect(
    (
      await db.query<{ n: number }>(
        "SELECT count(*)::int n FROM political_record.outbox_intents",
      )
    ).rows[0].n,
  ).toBe(count.rows[0].n);
});
it("versioned publication paging can include global briefings without assigning them to an election", async () => {
  const scoped = await repo.page({
    kind: "publication",
    electionId: "il-knesset-26",
    view: "latest",
    after: "0",
    limit: 20,
  });
  const combined = await repo.page({
    kind: "publication",
    electionId: "il-knesset-26",
    includeGlobal: true,
    view: "latest",
    after: "0",
    limit: 20,
  });
  expect(
    scoped.records.some((row) => row.recordId === "briefing:2026-11-04"),
  ).toBe(false);
  expect(
    combined.records.find((row) => row.recordId === "briefing:2026-11-04")
      ?.electionId,
  ).toBeNull();
});
it("corrections replace exact evidence and hide old text while retaining historical labels", async () => {
  const old = (await repo.getLatest("briefing:2026-11-04"))!;
  const { briefing } = fixture(
    "The committee said the proposal remains under review.",
    "2026-11-04T13:00:00.000Z",
  );
  const result = await promoteReviewedBriefing(repo, archive, briefing);
  expect(result.revision).not.toBe(old.revisionId);
  expect(
    (await projectPublication(repo, old, "en", now, "latest")).payload
      .currentTextUnavailable,
  ).toBe(true);
  expect(
    (await projectPublication(repo, old, "en", now, "history")).historicalState,
  ).toBe("dependency_corrected");
  await expect(
    promoteReviewedBriefing(repo, archive, fixture().briefing),
  ).rejects.toThrow("briefing_revision_out_of_order");
});
it("removed claims are withdrawn through exact prior publication references beyond a latest500 claim window", async () => {
  const previous = (await repo.getLatest("briefing:2026-11-04"))!;
  const oldFactId = (previous.payload.recordRevisionIds as string[])[0];
  const noise = Array.from({ length: 510 }, (_, i) =>
    makeRecord({
      recordId: `unrelated-claim:${i}`,
      kind: "claim",
      electionId: null,
      effectiveAt: null,
      observedAt: now,
      status: "unknown",
      evidenceClass: "legacy_import",
      previousRevisionId: null,
      payload: {},
      provenance: { sourceIds: [], captureIds: [] },
    }),
  );
  await repo.append({ records: noise, sources: [], captures: [], outbox: [] });
  expect(
    (await repo.latest({ kind: "claim", limit: 500 })).records.some(
      (row) => row.revisionId === oldFactId,
    ),
  ).toBe(false);
  const { briefing, bundle } = fixture(
    "The committee said the proposal remains under review.",
    "2026-11-04T13:30:00.000Z",
  );
  bundle.claims[0].id = "replacement";
  bundle.review[0].id = "replacement";
  for (const translation of bundle.translations!) {
    translation.sentences[0].id = "replacement";
    translation.review[0].id = "replacement";
  }
  briefing.sentences[0].claimId = "replacement";
  briefing.verification!.claims[0].id = "replacement";
  briefing.verification!.claims[0].contentHash = claimHash(bundle.claims[0]);
  const bytes = Buffer.from(JSON.stringify(bundle));
  bodies.set(contentHash(bytes), bytes);
  briefing.capture!.captureHash = contentHash(bytes);
  await promoteReviewedBriefing(repo, archive, briefing);
  const oldFact = (await repo.getRevision(oldFactId))!;
  expect((await repo.getLatest(oldFact.recordId))?.status).toBe("withdrawn");
});
it("source withdrawal suppresses a published digest without rewriting its archived text", async () => {
  const publication = (await repo.getLatest("briefing:2026-11-04"))!;
  const fact = (await repo.getRevision(
    (publication.payload.recordRevisionIds as string[])[0],
  ))!;
  await repo.append({
    records: [
      makeRecord({
        ...fact,
        status: "withdrawn",
        observedAt: "2026-11-04T14:00:00Z",
        previousRevisionId: fact.revisionId,
      }),
    ],
    sources: [],
    captures: [],
    outbox: [],
  });
  expect(
    (await projectPublication(repo, publication, "he", now, "latest")).payload
      .currentTextUnavailable,
  ).toBe(true);
  expect(
    (await projectPublication(repo, publication, "he", now, "history"))
      .historicalState,
  ).toBe("dependency_withdrawn");
});
it("primary producer checkpoints draft then actual separate review; no send or acquisition occurs", async () => {
  expect(
    (await registerLivePublicationInputs(repo, "cbs", [], now)).status,
  ).toBe("baseline_seeded");
  const raw = await readFile(
    "lib/political-record/fixtures/cbs-price-120010.json",
    "utf8",
  );
  const acquired = await collectCbs(
    repo,
    archive,
    now,
    async () =>
      new Response(raw, { headers: { "content-type": "application/json" } }),
  );
  expect(
    (
      await registerLivePublicationInputs(
        repo,
        "cbs",
        acquired.revisionIds,
        now,
      )
    ).triggers,
  ).toBe(2);
  const model = vi.fn(async (stage: "draft" | "review") =>
    stage === "draft"
      ? {
          subject: "Recorded observation",
          text: "CBS recorded September 2026: index 105.3, monthly -0.5%, annual 1.6%, base 2024.",
        }
      : {
          supported: true,
          complete: true,
          attributionPreserved: true,
          noAddedInference: true,
        },
  );
  expect((await runPublicationStage(repo, archive, now, model)).status).toBe(
    "review",
  );
  expect(model).toHaveBeenCalledTimes(1);
  // A busy persistent platform must not hide an older review checkpoint behind its latest500 rows.
  const noise = Array.from({ length: 510 }, (_, i) => [
    makeRecord({
      recordId: `unrelated-health:${i}`,
      kind: "source_health",
      electionId: null,
      effectiveAt: null,
      observedAt: now,
      status: "unknown",
      evidenceClass: "model_output",
      previousRevisionId: null,
      payload: {},
      provenance: { sourceIds: [], captureIds: [] },
    }),
    makeRecord({
      recordId: `completed-job:${i}`,
      kind: "source_health",
      electionId: null,
      effectiveAt: null,
      observedAt: now,
      status: "unknown",
      evidenceClass: "model_output",
      previousRevisionId: null,
      payload: { stage: "done", nextAt: now },
      provenance: {
        sourceIds: [],
        captureIds: [],
        parserVersion: "private-publication-job-v1",
      },
    }),
  ]).flat();
  await repo.append({ records: noise, sources: [], captures: [], outbox: [] });
  expect(
    (await repo.latest({ kind: "source_health", limit: 500 })).records.some(
      (row) => row.payload.stage === "review",
    ),
  ).toBe(false);
  expect((await runPublicationStage(repo, archive, now, model)).status).toBe(
    "done",
  );
  expect(model.mock.calls.map((call) => call[0])).toEqual(["draft", "review"]);
  const publications = (
    await repo.latest({ kind: "publication" })
  ).records.filter((row) => row.recordId.startsWith("notice:"));
  expect(publications).toHaveLength(1);
  expect(
    (await projectPublication(repo, publications[0], "en", now, "latest"))
      .payload.currentTextUnavailable,
  ).toBe(false);
});
it("initial backfill/activation does not produce major-event jobs", async () => {
  const before = (
    await repo.latest({ kind: "source_health", limit: 500 })
  ).records.filter(
    (row) => row.provenance.parserVersion === "private-publication-job-v1",
  ).length;
  expect(
    (await registerLivePublicationInputs(repo, "lifecycle", [], now)).status,
  ).toBe("baseline_seeded");
  await discoverPublicationJobs(repo, now);
  expect(
    (await repo.latest({ kind: "source_health", limit: 500 })).records.filter(
      (row) => row.provenance.parserVersion === "private-publication-job-v1",
    ).length,
  ).toBe(before);
});
it("three failed stage attempts checkpoint/back off then block; other locales remain eligible", async () => {
  const model = vi.fn(async () => {
    throw new Error("provider_billing");
  });
  for (let n = 0; n < 40; n++) {
    const at = new Date(Date.parse(now) + n * 3 * 60000).toISOString();
    expect((await runPublicationStage(repo, archive, at, model)).status).toBe(
      "retry_or_blocked",
    );
    if (
      (await repo.producerJobs(100, true)).some(
        (row) => row.payload.stage === "blocked",
      )
    )
      break;
  }
  const blocked = (
    await repo.latest({ kind: "source_health", limit: 500 })
  ).records.find(
    (row) =>
      row.payload.stage === "blocked" &&
      row.payload.errorCode === "provider_billing",
  );
  expect(blocked?.payload.attempts).toBe(3);
  expect(model.mock.calls.length).toBeGreaterThanOrEqual(3);
  const other = vi.fn(async () => ({
    subject: "Observation",
    text: "CBS recorded an observation.",
  }));
  expect(
    (
      await runPublicationStage(
        repo,
        archive,
        "2026-11-04T16:00:00.000Z",
        other,
      )
    ).status,
  ).toBe("review");
  expect(other).toHaveBeenCalledTimes(1);
  expect(
    (await repo.producerJobs(1, false, "2026-11-04T16:00:00.000Z"))[0].payload
      .attempts,
  ).toBe(0);
});
it("a missing private bundle cannot append any publication", async () => {
  const { briefing, hash } = fixture(
    "A different committee said the proposal was not approved.",
    "2026-11-04T15:00:00.000Z",
  );
  bodies.delete(hash);
  const before = (await repo.getLatest("briefing:2026-11-04"))?.revisionId;
  await expect(
    promoteReviewedBriefing(repo, archive, briefing),
  ).rejects.toThrow("capture_unavailable");
  expect((await repo.getLatest("briefing:2026-11-04"))?.revisionId).toBe(
    before,
  );
});
it("blocked jobs require an audited explicit recovery and still recheck their evidence", async () => {
  const blocked = (
    await repo.latest({ kind: "source_health", limit: 500 })
  ).records.find((row) => row.payload.stage === "blocked")!;
  await expect(
    recoverPublicationJob(
      repo,
      {
        jobId: blocked.recordId,
        operator: "",
        reason: "retry after configuration repair",
      },
      now,
    ),
  ).rejects.toThrow("producer_recovery_audit_required");
  expect(
    (
      await recoverPublicationJob(
        repo,
        {
          jobId: blocked.recordId,
          operator: "test-operator",
          reason: "synthetic recovery rehearsal",
        },
        now,
      )
    ).status,
  ).toBe("recovered");
  const recovered = (await repo.getLatest(blocked.recordId))!;
  expect(recovered.payload.stage).toBe("queued");
  expect(recovered.payload.attempts).toBe(0);
  expect(recovered.previousRevisionId).toBe(blocked.revisionId);
});
it("public reviewed markers cannot promote changed locale text", async () => {
  const { briefing } = fixture();
  briefing.sentences[0].translations!.he!.text =
    "Changed without private review";
  expect([...(await replayBriefing(briefing, archive)).locales.keys()]).toEqual(
    ["en"],
  );
});
it("provider errors are categorical, bounded and never export provider response bodies", async () => {
  vi.stubEnv("GEMINI_API_KEY", "private-fixture-key");
  const fetcher = vi.fn(
    async () =>
      new Response("secret provider account diagnostics", { status: 402 }),
  );
  vi.stubGlobal("fetch", fetcher);
  await expect(producerModel("draft", {})).rejects.toThrow("provider_billing");
  expect(fetcher.mock.calls).toHaveLength(1);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("default-off hook performs no database, provider or queue access", async () => {
  vi.stubEnv("POLITICAL_PUBLICATION_PRODUCER_ENABLED", "false");
  expect(await queueReviewedBriefing(fixture().briefing)).toEqual({
    status: "disabled",
  });
  vi.unstubAllEnvs();
});
it("archives rejected numeric candidate privately, checkpoints its receipt, and never reviews or publishes it", async () => {
  const fact = (await repo.latest({ kind: "indicator_observation", limit: 20 }))
    .records[0];
  const job = makeRecord({
    recordId: `producer:primary:${fact.revisionId}:en:validation-test`,
    kind: "source_health",
    electionId: null,
    effectiveAt: null,
    observedAt: now,
    status: "unknown",
    evidenceClass: "model_output",
    previousRevisionId: null,
    payload: {
      mode: "primary",
      stage: "queued",
      attempts: 0,
      nextAt: now,
      factRevisionId: fact.revisionId,
      locale: "en",
    },
    provenance: {
      sourceIds: [],
      captureIds: [],
      parserVersion: "private-publication-job-v1",
    },
  });
  await repo.append({ records: [job], sources: [], captures: [], outbox: [] });
  const pending = vi.spyOn(repo, "producerJobs").mockResolvedValue([job]);
  const candidate = {
    subject: "Unqualified candidate",
    text: "CBS recorded 99.9% in September 2026.",
  };
  const model = vi.fn(async () => candidate);
  const before = (await repo.latest({ kind: "publication", limit: 100 }))
    .records.length;
  try {
    const result = await runPublicationStage(repo, archive, now, model);
    expect(result).toEqual({
      status: "retry_or_blocked",
      errorCode: "draft_unsupported_number",
      more: false,
    });
    expect(model).toHaveBeenCalledTimes(1);
    const checkpoint = (await repo.getLatest(job.recordId))!;
    const ids = checkpoint.payload.failureCaptureIds as string[];
    expect(ids).toHaveLength(1);
    const capture = (await repo.getCapture(ids[0]))!;
    const evidence = JSON.parse(
      new TextDecoder().decode(await archive.read(capture)),
    );
    expect(evidence.candidate).toEqual(candidate);
    expect(evidence.factRevisionId).toBe(fact.revisionId);
    expect(evidence.issues).toContainEqual(
      expect.objectContaining({
        code: "unsupported_quantity",
        token: "99.9%",
        unit: "percent",
      }),
    );
    expect(JSON.stringify(result)).not.toContain("99.9");
    expect(
      (await repo.latest({ kind: "publication", limit: 100 })).records,
    ).toHaveLength(before);
  } finally {
    pending.mockRestore();
  }
});
