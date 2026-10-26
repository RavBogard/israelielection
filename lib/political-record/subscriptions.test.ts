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
    /https:\/\/example\.org\/subscriptions\/confirm\?token=\S+/,
  )![0];
  const token = new URL(url).searchParams.get("token")!;
  return { token, confirmed: await service.confirm(token, now) };
}
async function publication(suffix: string) {
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
  const fact = makeRecord({
    ...base,
    recordId: `synthetic-test-fact:${suffix}`,
    kind: "indicator_observation",
    payload: { synthetic: true },
  });
  const pub = makeRecord({
    ...base,
    recordId: `synthetic-publication:${suffix}`,
    kind: "publication",
    payload: {
      recordRevisionIds: [fact.revisionId],
      category: "fact_change",
      titleKey: "test",
      data: { topics: ["formation"] },
    },
  });
  const edition = makeRecord({
    ...base,
    recordId: `synthetic-edition:${suffix}:en`,
    kind: "edition",
    payload: {
      publicationRevisionId: pub.revisionId,
      translatedFromRevisionId: pub.revisionId,
      locale: "en",
      state: "ready",
      content: {
        subject: "Synthetic fixture update",
        text: "This is a test fixture, not a political assertion.",
      },
    },
  });
  await repository.append({
    records: [fact, pub, edition],
    sources: [],
    captures: [],
    outbox: [publicationIntent(pub, "publication_committed")],
  });
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
