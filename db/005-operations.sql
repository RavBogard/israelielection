BEGIN;
CREATE TABLE IF NOT EXISTS political_private.operation_incidents(
 id text PRIMARY KEY CHECK(id ~ '^[a-f0-9]{64}$'), namespace text NOT NULL, scope text NOT NULL, subject_id text NOT NULL,
 state text NOT NULL CHECK(state IN ('open','resolved')), severity text NOT NULL CHECK(severity IN ('warning','error')),
 reason_code text NOT NULL, first_seen_at timestamptz NOT NULL,last_seen_at timestamptz NOT NULL,resolved_at timestamptz,
 failures integer NOT NULL DEFAULT 0, last_confirmed_healthy_at timestamptz, last_observation jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS political_private.operation_incident_events(
 id text PRIMARY KEY CHECK(id ~ '^[a-f0-9]{64}$'),incident_id text NOT NULL REFERENCES political_private.operation_incidents(id),
 observed_at timestamptz NOT NULL, transition text NOT NULL CHECK(transition IN ('opened','changed','resolved')),payload jsonb NOT NULL
);
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='operation_incident_events_append_only' AND tgrelid='political_private.operation_incident_events'::regclass) THEN CREATE TRIGGER operation_incident_events_append_only BEFORE UPDATE OR DELETE ON political_private.operation_incident_events FOR EACH ROW EXECUTE FUNCTION political_record.reject_mutation(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='operation_incident_events_no_truncate' AND tgrelid='political_private.operation_incident_events'::regclass) THEN CREATE TRIGGER operation_incident_events_no_truncate BEFORE TRUNCATE ON political_private.operation_incident_events FOR EACH STATEMENT EXECUTE FUNCTION political_record.reject_mutation(); END IF; END $$;
CREATE TABLE IF NOT EXISTS political_private.operation_checks(id text PRIMARY KEY CHECK(id ~ '^[a-f0-9]{64}$'),namespace text NOT NULL,observed_at timestamptz NOT NULL,payload jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS political_private.operation_receipts(id text PRIMARY KEY CHECK(id ~ '^[a-f0-9]{64}$'),namespace text NOT NULL,observed_at timestamptz NOT NULL);
COMMIT;
