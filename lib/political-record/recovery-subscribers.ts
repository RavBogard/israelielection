import type { Pool } from "pg";
import { SubscriptionService } from "./subscriptions";
import { PrivateCrypto, type EmailMessage } from "./email";
import type { SqlPool } from "./postgres";
import { recordHash } from "./hash";

/** Synthetic-only fixture builder. The only sender is an in-memory function. */
export async function seedRecoverySubscribers(
  pool: Pool,
  crypto: PrivateCrypto,
  publication: string,
  now: string,
  cohort = "synthetic",
) {
  if (!/^synthetic(?:-retry)?$/.test(cohort))
    throw Error("synthetic_cohort_invalid");
  const messages: { message: EmailMessage; key: string; id: string }[] = [];
  const mail = {
    send: async (message: EmailMessage, key: string) => {
      if (!message.to.endsWith("@recovery.invalid"))
        throw Error("synthetic_recipient_required");
      const id = `synthetic:${key}`;
      messages.push({ message, key, id });
      return { id };
    },
  };
  const service = new SubscriptionService(
    pool as unknown as SqlPool,
    crypto,
    mail,
    "https://recovery.invalid",
    "synthetic-recovery-v1",
  );
  const confirmations = [];
  for (let n = 0; n < 4; n++) {
    const email = `${cohort}-${n}@recovery.invalid`;
    const existing = (
      await pool.query(
        "SELECT id,consent_state,consent_version,email_ciphertext FROM political_private.subscribers WHERE email_hash=$1",
        [crypto.hash(`email:${email}`)],
      )
    ).rows[0];
    if (existing) {
      if (
        existing.consent_state !== "confirmed" ||
        existing.consent_version !== "synthetic-recovery-v1" ||
        crypto.decrypt(existing.email_ciphertext) !== email
      )
        throw Error("synthetic_partial_consent_mismatch");
      // Explicit fixture resume only: preserve prior scoped token receipts and append fresh synthetic test tokens.
      const preferencesToken = crypto.token(),
        unsubscribeToken = crypto.token();
      for (const [purpose, raw] of [
        ["preferences", preferencesToken],
        ["unsubscribe", unsubscribeToken],
      ])
        await pool.query(
          "INSERT INTO political_private.subscription_tokens(token_hash,subscriber_id,purpose,payload_ciphertext,expires_at,created_at) VALUES($1,$2,$3,$4,$5,$6)",
          [
            crypto.hash(`${purpose}:${raw}`),
            existing.id,
            purpose,
            crypto.encrypt({}),
            purpose === "unsubscribe"
              ? null
              : new Date(Date.parse(now) + 90 * 86400000).toISOString(),
            now,
          ],
        );
      confirmations.push({ preferencesToken, unsubscribeToken });
      continue;
    }
    await service.subscribe(email, "en", ["policies"], true, now);
    const delivered = await service.deliver(now);
    if (delivered.sent !== 1) throw Error("synthetic_confirmation_failed");
    const raw = new URLSearchParams(
      new URL(
        messages
          .at(-1)!
          .message.text.match(
            /https:\/\/recovery.invalid\/subscriptions\/confirm#token=\S+/,
          )![0],
      ).hash.slice(1),
    ).get("token")!;
    confirmations.push(await service.confirm(raw, now));
  }
  // A previous empty fixture fanout may have completed before a retry cohort existed.
  // Reopening the fixture's EN cursor is safe: delivery uniqueness still prevents repeats.
  await pool.query(
    "UPDATE political_private.publication_fanout SET completed=false,subscriber_cursor=NULL WHERE publication_revision_id=$1 AND locale='en'",
    [publication],
  );
  let queued = 0;
  for (let n = 0; n < 8 && queued < 4; n++)
    queued += (await service.queuePublication(publication, now)).queued;
  if (queued !== 4 || (await service.deliver(now)).sent !== 4)
    throw Error("synthetic_publication_failed");
  await service.unsubscribe(confirmations[1].unsubscribeToken, now);
  const bounce = messages.find(
    (row) =>
      row.message.to === `${cohort}-2@recovery.invalid` &&
      !row.message.text.includes("/subscriptions/confirm"),
  )!;
  const complaint = messages.find(
    (row) =>
      row.message.to === `${cohort}-3@recovery.invalid` &&
      !row.message.text.includes("/subscriptions/confirm"),
  )!;
  await service.webhook(
    "synthetic-recovery-bounce",
    "email.bounced",
    bounce.id,
    now,
  );
  await service.webhook(
    "synthetic-recovery-complaint",
    "email.complained",
    complaint.id,
    now,
  );
  // A stale in-flight correction plus queued corrections must not bypass restored suppressions.
  for (let n = 1; n < 4; n++)
    await pool.query(
      "INSERT INTO political_private.deliveries(id,subscriber_id,publication_revision_id,kind,status,payload_ciphertext,created_at,next_attempt_at,retry_until,lease_until) SELECT $1,s.id,d.publication_revision_id,'correction',$2,d.payload_ciphertext,$3,$3,$4,$5 FROM political_private.subscribers s CROSS JOIN LATERAL (SELECT * FROM political_private.deliveries WHERE kind='publication' AND status='sent' LIMIT 1) d WHERE s.email_hash=$6",
      [
        recordHash({ syntheticCorrection: n }),
        n === 1 ? "sending" : "queued",
        now,
        new Date(Date.parse(now) + 86400000).toISOString(),
        new Date(Date.parse(now) - 60000).toISOString(),
        crypto.hash(`email:${cohort}-${n}@recovery.invalid`),
      ],
    );
  await service.subscribe(
    `${cohort}-pending@recovery.invalid`,
    "he",
    ["policies"],
    true,
    now,
  );
  await pool.query(
    "UPDATE political_private.deliveries SET next_attempt_at=$1 WHERE status='queued' AND kind='confirm'",
    [new Date(Date.parse(now) + 86400000).toISOString()],
  );
  return {
    fakeSends: messages.length,
    unsubscribeToken: confirmations[1].unsubscribeToken,
    preferencesToken: confirmations[1].preferencesToken,
    bounceProviderId: bounce.id,
    publication,
  };
}
export async function verifyRecoveredSubscribers(
  pool: Pool,
  crypto: PrivateCrypto,
  fixture: Awaited<ReturnType<typeof seedRecoverySubscribers>>,
  now: string,
) {
  let fakeSends = 0;
  const service = new SubscriptionService(
    pool as unknown as SqlPool,
    crypto,
    {
      send: async () => {
        fakeSends++;
        throw Error("restored_duplicate_send");
      },
    },
    "https://recovery.invalid",
    "synthetic-recovery-v1",
  );
  const delivered = await service.deliver(now);
  if (fakeSends || delivered.sent || delivered.suppressed !== 3)
    throw Error("restored_suppression_failed");
  if ((await service.queuePublication(fixture.publication, now)).queued)
    throw Error("restored_fanout_repeated");
  await service.unsubscribe(fixture.unsubscribeToken, now);
  let blocked = false;
  try {
    await service.preferences(fixture.preferencesToken, undefined, now);
  } catch {
    blocked = true;
  }
  if (!blocked) throw Error("restored_suppressed_preferences_usable");
  if (
    (
      await service.webhook(
        "synthetic-recovery-bounce",
        "email.bounced",
        fixture.bounceProviderId,
        now,
      )
    ).status !== "duplicate"
  )
    throw Error("restored_webhook_repeated");
  const rows = (
    await pool.query(
      "SELECT consent_state,suppression_reason,count(*)::int n FROM political_private.subscribers GROUP BY consent_state,suppression_reason ORDER BY consent_state,suppression_reason",
    )
  ).rows;
  return {
    duplicateSends: fakeSends,
    correctionsSuppressed: delivered.suppressed,
    unsubscribeIdempotent: true,
    consumedPreferencesDenied: true,
    webhookDeduplicated: true,
    states: rows,
  };
}
