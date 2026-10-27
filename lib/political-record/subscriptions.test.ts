import { collectCbs } from "./cbs";
import { storeReviewedPublicationEdition } from "./publications";
import { recordHash } from "./hash";
import { makeCapture } from "./records";
import { contentHash, type CaptureArchive } from "./captures";
import { beforeAll, afterAll, afterEach, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { SubscriptionService } from "./subscriptions";
import {
  PrivateCrypto,
  confirmationEmail,
  EMAIL_LOCALES,
  ResendMailProvider,
  type EmailMessage,
} from "./email";
import { PostgresPoliticalRecords, type SqlPool } from "./postgres";
import { makeRecord, publicationIntent } from "./records";
const fixtureArchive: CaptureArchive = {
  put: async (source, body, mediaType) =>
    makeCapture({
      sourceRevisionId: source.revisionId,
      contentSha256: contentHash(body),
      storageKey: `private/${contentHash(body)}`,
      mediaType,
      byteLength: body.length,
      observedAt: source.observedAt,
    }),
  read: async () => new Uint8Array(),
};
let db: PGlite,
  service: SubscriptionService,
  repository: PostgresPoliticalRecords;
const mail =
  vi.fn<(message: EmailMessage, key: string) => Promise<{ id: string }>>();
const now = "2026-11-04T12:00:00Z",
  later = "2026-11-04T12:05:00Z";
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    await readFile(path.resolve("db/001-political-record.sql"), "utf8"),
  );
  await db.exec(
    await readFile(path.resolve("db/002-subscriptions.sql"), "utf8"),
  );
  await db.exec(await readFile("db/004-distribution.sql", "utf8"));
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
  const raw = await readFile(
    "lib/political-record/fixtures/cbs-price-120010.json",
    "utf8",
  );
  await collectCbs(
    repository,
    fixtureArchive,
    now,
    async () =>
      new Response(raw, { headers: { "content-type": "application/json" } }),
  );
  service = new SubscriptionService(
    pool,
    new PrivateCrypto(Buffer.alloc(32, 1), "test-secret-".repeat(4)),
    { send: mail },
    "https://example.org",
    "test-consent-v1",
  );
}, 30000);
afterAll(async () => {
  await db?.close();
});
afterEach(() => {
  mail.mockReset();
});
async function subscribeConfirmed(email: string) {
  mail.mockResolvedValue({ id: "confirmation-" + email });
  await service.subscribe(email, "en", ["formation"], true, now);
  await service.deliver(now);
  const message = mail.mock.calls.find(
    ([message]) => message.to === email,
  )?.[0];
  expect(message).toBeTruthy();
  const url = message!.text.match(
    /https:\/\/example\.org\/subscriptions\/confirm#token=\S+/,
  )![0];
  const token = new URLSearchParams(new URL(url).hash.slice(1)).get("token")!;
  return { token, confirmed: await service.confirm(token, now) };
}
async function publication(
  suffix: string,
  data: Record<string, unknown> = { topics: ["formation"] },
) {
  const base = {
    electionId: "il-knesset-26",
    effectiveAt: null,
    observedAt: later,
    status: "confirmed" as const,
    evidenceClass: "primary_confirmed" as const,
    previousRevisionId: null,
    provenance: {
      sourceIds: [],
      captureIds: [],
      parserVersion: "cbs-price-v1",
    },
  };
  const template = (
    await repository.latest({ kind: "indicator_observation", globalOnly: true })
  ).records.find((record) => record.recordId.startsWith("indicator:cbs:"))!;
  const fact = makeRecord({
    ...base,
    provenance: template.provenance,
    electionId: null,
    recordId: `synthetic-test-fact:${suffix}`,
    kind: "indicator_observation",
    payload: template.payload,
  });
  const pub = makeRecord({
    ...base,
    recordId: `synthetic-publication:${suffix}`,
    kind: "publication",
    payload: {
      recordRevisionIds: [fact.revisionId],
      category: "fact_change",
      titleKey: "test",
      data,
    },
  });
  await repository.append({
    records: [fact, pub],
    sources: [],
    captures: [],
    outbox: [publicationIntent(pub, "publication_committed")],
  });
  const content = {
    subject: "Synthetic fixture update",
    text: "This is a test fixture, not a political assertion.",
  };
  await storeReviewedPublicationEdition(
    repository,
    pub.revisionId,
    "en",
    content,
    {
      decision: "approve",
      publicationRevisionId: pub.revisionId,
      locale: "en",
      contentHash: recordHash(content),
      factRevisionIds: [fact.revisionId],
      generationRunId: "generation-test",
      reviewRunId: "review-test",
      provider: "fixture",
      model: "fixture",
    },
    fixtureArchive,
    now,
  );
  return { fact, pub };
}
async function fanout(revision: string) {
  for (let n = 0; n < 8; n++) await service.queuePublication(revision, later);
}
it("requires explicit consent, keeps addresses/tokens encrypted or hashed, and confirms once", async () => {
  await expect(
    service.subscribe("bad@example.org", "en", ["formation"], false, now),
  ).rejects.toThrow("invalid_subscription");
  expect(mail).not.toHaveBeenCalled();
  const { token, confirmed } = await subscribeConfirmed("one@example.org");
  expect(confirmed.status).toBe("confirmed");
  expect(
    await service.preferences(confirmed.preferencesToken, undefined, now),
  ).toMatchObject({ locale: "en", topics: ["formation"] });
  await expect(service.confirm(token, now)).rejects.toThrow("invalid_token");
  await expect(
    service.unsubscribe(confirmed.preferencesToken, now),
  ).rejects.toThrow("invalid_token");
  const raw =
    JSON.stringify(
      (await db.query("SELECT * FROM political_private.subscribers")).rows,
    ) +
    JSON.stringify(
      (await db.query("SELECT * FROM political_private.subscription_tokens"))
        .rows,
    );
  expect(raw).not.toContain("one@example.org");
  expect(raw).not.toContain(token);
});
it("delivers only the matching ready edition once and suppresses after unsubscribe", async () => {
  const { confirmed } = await subscribeConfirmed("two@example.org");
  const { pub } = await publication("delivery");
  await fanout(pub.revisionId);
  await fanout(pub.revisionId);
  mail.mockClear();
  mail.mockResolvedValue({ id: "publication-two" });
  const result = await service.deliver(later);
  expect(result.sent).toBeGreaterThan(0);
  expect(
    mail.mock.calls.filter(([message]) => message.to === "two@example.org"),
  ).toHaveLength(1);
  expect(mail.mock.calls[0][0].unsubscribeUrl).toContain(
    "/api/subscriptions/unsubscribe?",
  );
  expect((await service.deliver(later)).sent).toBe(0);
  await service.unsubscribe(confirmed.unsubscribeToken, later);
  await service.unsubscribe(confirmed.unsubscribeToken, later);
  const next = await publication("suppressed");
  await fanout(next.pub.revisionId);
  mail.mockClear();
  await service.deliver(later);
  expect(
    mail.mock.calls.every(([message]) => message.to !== "two@example.org"),
  ).toBe(true);
});
it("rechecks dependency corrections before a queued email can leave", async () => {
  await subscribeConfirmed("three@example.org");
  const { fact, pub } = await publication("correction");
  await fanout(pub.revisionId);
  const withdrawal = makeRecord({
    ...fact,
    previousRevisionId: fact.revisionId,
    status: "withdrawn",
    payload: { synthetic: true, withdrawn: true },
  });
  await repository.append({
    records: [withdrawal],
    sources: [],
    captures: [],
    outbox: [],
  });
  mail.mockClear();
  const result = await service.deliver(later);
  expect(result.suppressed).toBeGreaterThan(0);
  expect(mail).not.toHaveBeenCalled();
});
it("suppresses verified provider bounce receipts idempotently", async () => {
  await subscribeConfirmed("bounce@example.org");
  expect(
    (
      await service.webhook(
        "fixture-webhook-1",
        "email.bounced",
        "confirmation-bounce@example.org",
        later,
      )
    ).status,
  ).toBe("accepted");
  expect(
    (
      await service.webhook(
        "fixture-webhook-1",
        "email.bounced",
        "confirmation-bounce@example.org",
        later,
      )
    ).status,
  ).toBe("duplicate");
  const subscriber = (
    await db.query(
      "SELECT consent_state,suppression_reason FROM political_private.subscribers WHERE email_hash=$1",
      [
        new PrivateCrypto(Buffer.alloc(32, 1), "test-secret-".repeat(4)).hash(
          "email:bounce@example.org",
        ),
      ],
    )
  ).rows[0];
  expect(subscriber).toEqual({
    consent_state: "suppressed",
    suppression_reason: "bounce",
  });
});
it("uses stable provider idempotency and refuses to retry after its safe window", async () => {
  mail.mockRejectedValue(new Error("network timeout"));
  await service.subscribe("retry@example.org", "en", ["formation"], true, now);
  await service.deliver(now);
  const key = mail.mock.calls[0][1];
  await service.deliver(later);
  expect(mail.mock.calls[1][1]).toBe(key);
  mail.mockClear();
  await service.deliver("2026-11-05T12:00:00Z");
  expect(mail).not.toHaveBeenCalled();
});
it("resumes locale-specific fanout beyond one page while unavailable editions do not block a good edition", async () => {
  const crypto = new PrivateCrypto(
    Buffer.alloc(32, 1),
    "test-secret-".repeat(4),
  );
  for (let n = 0; n < 28; n++) {
    const email = `large-fixture-${n}@example.org`,
      locale = n === 27 ? "ar" : "en";
    await db.query(
      "INSERT INTO political_private.subscribers(id,email_hash,email_ciphertext,locale,topics,consent_state,consent_version,requested_at,confirmed_at) VALUES($1,$2,$3,$4,$5,'confirmed','synthetic-test-only',$6,$6)",
      [
        randomUUID(),
        crypto.hash(`email:${email}`),
        crypto.encrypt(email),
        locale,
        JSON.stringify(["formation"]),
        now,
      ],
    );
  }
  const { pub } = await publication("large-fanout");
  for (let n = 0; n < 20; n++)
    await service.queuePublication(pub.revisionId, later);
  const deliveries = (
    await db.query<Record<string, unknown>>(
      "SELECT d.id,s.locale FROM political_private.deliveries d JOIN political_private.subscribers s ON s.id=d.subscriber_id WHERE d.publication_revision_id=$1",
      [pub.revisionId],
    )
  ).rows;
  expect(deliveries.length).toBeGreaterThanOrEqual(27);
  expect(new Set(deliveries.map((row) => row.id)).size).toBe(deliveries.length);
  expect(deliveries.every((row) => row.locale === "en")).toBe(true);
});
it("has localized confirmation copy for all seven editions and no provider tracking payload", async () => {
  expect(
    new Set(
      EMAIL_LOCALES.map(
        (locale) =>
          confirmationEmail(locale, "https://example.org/confirm").subject,
      ),
    ).size,
  ).toBe(7);
  const fetcher = vi
    .fn()
    .mockResolvedValue(Response.json({ id: "provider-fixture" }));
  const provider = new ResendMailProvider(
    "private-test-key",
    "Updates <updates@example.org>",
    fetcher,
  );
  await provider.send(
    { to: "fixture@example.org", subject: "Test", text: "Fixture" },
    "stable-id",
  );
  expect(fetcher.mock.calls[0][1].headers["Idempotency-Key"]).toBe("stable-id");
  expect(fetcher.mock.calls[0][1].body).not.toMatch(
    /tracking|pixel|open_tracking/,
  );
});

it("confirmation landing follows the selected language with a fragment-only bearer", async () => {
  mail.mockResolvedValue({ id: "confirmation-he" });
  await service.subscribe(
    "he-landing@example.org",
    "he",
    ["formation"],
    true,
    now,
  );
  await service.deliver(now);
  const copy = mail.mock.calls.find(
    ([message]) => message.to === "he-landing@example.org",
  )![0];
  const link = copy.text.match(
      /https:\/\/example\.org\/he\/subscriptions\/confirm#token=\S+/,
    )![0],
    url = new URL(link);
  expect(url.search).toBe("");
  expect(url.hash).toContain("token=");
});

it("follows-only preferences are verified, can change independently and suppress queued alerts", async () => {
  const email = "follow-only@example.org",
    channels = { dailyDigest: false, majorEvents: true, corrections: true };
  mail.mockResolvedValue({ id: "typed-follow-confirm" });
  await service.subscribe(email, "en", [], true, now, {
    follows: { parties: ["likud"], issues: ["economy"], places: ["3000"] },
    delivery: channels,
  });
  await service.deliver(now);
  const link = mail.mock.calls
    .find(([message]) => message.to === email)![0]
    .text.match(/https:\/\/example\.org\/subscriptions\/confirm#token=\S+/)![0];
  const confirmed = await service.confirm(
    new URLSearchParams(new URL(link).hash.slice(1)).get("token")!,
    now,
  );
  expect(confirmed.preferenceVersion).toBe(2);
  expect(confirmed.follows.parties).toEqual(["likud"]);
  const { pub } = await publication("follow-alert", {
    topics: [],
    delivery: "major_event",
    follows: { parties: ["likud"], issues: [], places: [] },
  });
  await fanout(pub.revisionId);
  await service.preferences(
    confirmed.preferencesToken,
    {
      locale: "en",
      topics: [],
      follows: { parties: ["likud"], issues: [], places: [] },
      delivery: { ...channels, majorEvents: false },
    },
    later,
  );
  mail.mockClear();
  await service.deliver(later);
  expect(mail.mock.calls.some(([message]) => message.to === email)).toBe(false);
});
it("requires the queued edition and independent review to remain current before delivery", async () => {
  const email = "edition-correction@example.org";
  await subscribeConfirmed(email);
  const { pub } = await publication("edition-changed");
  await fanout(pub.revisionId);
  const edition = await repository.getLatest(
    `publication-edition:${pub.revisionId}:en`,
  );
  const withdrawal = makeRecord({
    ...edition!,
    status: "withdrawn",
    previousRevisionId: edition!.revisionId,
    observedAt: later,
  });
  await repository.append({
    records: [withdrawal],
    sources: [],
    captures: [],
    outbox: [],
  });
  mail.mockClear();
  await service.deliver(later);
  expect(mail.mock.calls.some(([message]) => message.to === email)).toBe(false);
});
it("queues at most one digest per date while a major alert remains a separate channel", async () => {
  const email = "daily-only@example.org";
  mail.mockResolvedValue({ id: "daily-confirm" });
  await service.subscribe(email, "en", ["digest"], true, now, {
    delivery: { dailyDigest: true, majorEvents: false, corrections: true },
  });
  await service.deliver(now);
  const link = mail.mock.calls
    .find(([message]) => message.to === email)![0]
    .text.match(/https:\/\/example\.org\/subscriptions\/confirm#token=\S+/)![0];
  await service.confirm(
    new URLSearchParams(new URL(link).hash.slice(1)).get("token")!,
    now,
  );
  for (const suffix of ["daily-first", "daily-second"]) {
    const { pub } = await publication(suffix, {
      topics: ["digest"],
      delivery: "daily_digest",
      digestDate: "2026-11-04",
    });
    for (let attempt = 0; attempt < 16; attempt++)
      await service.queuePublication(pub.revisionId, later);
  }
  const rows = await db.query<{ count: number }>(
    "SELECT count(*)::int AS count FROM political_private.deliveries d JOIN political_private.subscribers s ON s.id=d.subscriber_id WHERE s.email_hash=$1 AND d.kind='publication'",
    [
      new PrivateCrypto(Buffer.alloc(32, 1), "test-secret-".repeat(4)).hash(
        `email:${email}`,
      ),
    ],
  );
  expect(rows.rows[0].count).toBe(1);
});

it("prioritizes a new confirmation over an older queued publication", async () => {
  const email = "priority-confirm@example.org";
  mail.mockResolvedValue({ id: "priority-confirm" });
  await service.subscribe(email, "en", ["formation"], true, now);
  mail.mockClear();
  await service.deliver(later, 1);
  expect(mail.mock.calls[0][0].to).toBe(email);
});
