-- Private mutable delivery state is separate from the append-only public fact ledger.
BEGIN;
CREATE SCHEMA IF NOT EXISTS political_private;
CREATE TABLE IF NOT EXISTS political_private.subscribers (
 id uuid PRIMARY KEY, email_hash text UNIQUE NOT NULL CHECK(email_hash ~ '^[a-f0-9]{64}$'),
 email_ciphertext text NOT NULL, locale text NOT NULL CHECK(locale IN ('en','he','ar','fa','de','fr','zh')),
 topics jsonb NOT NULL CHECK(jsonb_typeof(topics)='array'),
 consent_state text NOT NULL CHECK(consent_state IN ('pending','confirmed','suppressed')),
 consent_version text NOT NULL, requested_at timestamptz NOT NULL, confirmed_at timestamptz, suppressed_at timestamptz,
 suppression_reason text CHECK(suppression_reason IN ('unsubscribe','bounce','complaint'))
);
CREATE TABLE IF NOT EXISTS political_private.subscription_tokens (
 token_hash text PRIMARY KEY CHECK(token_hash ~ '^[a-f0-9]{64}$'), subscriber_id uuid NOT NULL REFERENCES political_private.subscribers(id),
 purpose text NOT NULL CHECK(purpose IN ('confirm','preferences','unsubscribe')), payload_ciphertext text NOT NULL,
 expires_at timestamptz, consumed_at timestamptz, created_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS subscription_token_subject ON political_private.subscription_tokens(subscriber_id,purpose);
CREATE TABLE IF NOT EXISTS political_private.deliveries (
 id text PRIMARY KEY CHECK(id ~ '^[a-f0-9]{64}$'), subscriber_id uuid NOT NULL REFERENCES political_private.subscribers(id),
 publication_revision_id text REFERENCES political_record.record_revisions(revision_id),
 kind text NOT NULL CHECK(kind IN ('confirm','publication','correction')),
 status text NOT NULL CHECK(status IN ('queued','sending','sent','suppressed','failed','ambiguous')),
 payload_ciphertext text NOT NULL, created_at timestamptz NOT NULL, next_attempt_at timestamptz NOT NULL,
 attempts integer NOT NULL DEFAULT 0, lease_until timestamptz, retry_until timestamptz NOT NULL,
 provider_id text, failure_code text,
 UNIQUE(subscriber_id,publication_revision_id,kind)
);
CREATE INDEX IF NOT EXISTS delivery_pending ON political_private.deliveries(status,next_attempt_at);
CREATE TABLE IF NOT EXISTS political_private.webhook_receipts (
 id text PRIMARY KEY, event_type text NOT NULL, received_at timestamptz NOT NULL
);
COMMIT;
