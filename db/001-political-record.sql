-- Foundation only. Apply manually to an approved development/preview database after review.
-- No worker or application request runs DDL. Existing Redis records/URLs are untouched.
BEGIN;
CREATE SCHEMA IF NOT EXISTS political_record;
CREATE TABLE IF NOT EXISTS political_record.record_revisions (
  revision_id text PRIMARY KEY CHECK (revision_id ~ '^[a-f0-9]{64}$'),
  insertion_cursor bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  record_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('election','entity','proposal','mandate_attempt','claim','event','snapshot','publication','edition','source_health','parliamentary_membership','bill','bill_version','roll_call','indicator_observation')),
  schema_version integer NOT NULL CHECK (schema_version = 1),
  election_id text,
  effective_at timestamptz,
  observed_at timestamptz NOT NULL,
  assertion_status text NOT NULL CHECK (assertion_status IN ('confirmed','reported','disputed','corrected','withdrawn','unknown')),
  evidence_class text NOT NULL CHECK (evidence_class IN ('primary_confirmed','reported_corroborated','legacy_import','model_output')),
  previous_revision_id text CHECK (previous_revision_id IS NULL OR previous_revision_id ~ '^[a-f0-9]{64}$'),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  provenance jsonb NOT NULL CHECK (jsonb_typeof(provenance) = 'object'),
  inserted_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS record_scope_cursor ON political_record.record_revisions(election_id, kind, revision_id);
CREATE INDEX IF NOT EXISTS record_identity_time ON political_record.record_revisions(record_id, observed_at DESC, revision_id);
CREATE INDEX IF NOT EXISTS record_effective_time ON political_record.record_revisions(election_id, effective_at);
CREATE TABLE IF NOT EXISTS political_record.source_revisions (
  revision_id text PRIMARY KEY CHECK (revision_id ~ '^[a-f0-9]{64}$'),
  source_id text NOT NULL,
  publisher text NOT NULL,
  title text NOT NULL,
  capture_hash text NOT NULL CHECK (capture_hash ~ '^[a-f0-9]{64}$'),
  url text NOT NULL CHECK (url LIKE 'https://%'),
  authority text NOT NULL,
  observed_at timestamptz NOT NULL,
  published_at timestamptz
);
CREATE TABLE IF NOT EXISTS political_record.private_captures (
  capture_id text PRIMARY KEY CHECK (capture_id ~ '^[a-f0-9]{64}$'),
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[a-f0-9]{64}$'),
  source_revision_id text NOT NULL REFERENCES political_record.source_revisions(revision_id),
  storage_key text NOT NULL CHECK (storage_key LIKE 'private/%' AND storage_key NOT LIKE '%..%'),
  media_type text NOT NULL,
  byte_length bigint NOT NULL CHECK (byte_length > 0),
  observed_at timestamptz NOT NULL
);
-- Intent creation is atomic with publication; recipient data belongs to a later separate private delivery store.
CREATE TABLE IF NOT EXISTS political_record.outbox_intents (
  id text PRIMARY KEY CHECK (id ~ '^[a-f0-9]{64}$'),
  topic text NOT NULL CHECK (topic IN ('publication_committed','record_corrected','edition_ready','readiness_blocked')),
  aggregate_revision_id text NOT NULL REFERENCES political_record.record_revisions(revision_id),
  created_at timestamptz NOT NULL,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object')
);
CREATE INDEX IF NOT EXISTS outbox_created_cursor ON political_record.outbox_intents(created_at,id);
CREATE OR REPLACE FUNCTION political_record.reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'political record revisions are append-only'; END;
$$;
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['record_revisions','source_revisions','private_captures','outbox_intents'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = table_name || '_append_only'
      AND tgrelid = ('political_record.' || table_name)::regclass) THEN
      EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON political_record.%I FOR EACH ROW EXECUTE FUNCTION political_record.reject_mutation()', table_name || '_append_only', table_name);
    END IF;
  END LOOP;
END $$;
COMMIT;
