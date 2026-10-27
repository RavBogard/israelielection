-- Apply before enabling the producer. Existing evidence records remain immutable.
BEGIN;
ALTER TABLE political_record.record_revisions DROP CONSTRAINT record_revisions_evidence_class_check;
ALTER TABLE political_record.record_revisions ADD CONSTRAINT record_revisions_evidence_class_check
  CHECK (evidence_class IN ('primary_confirmed','reported_corroborated','attributed_analysis','legacy_import','model_output'));
CREATE INDEX IF NOT EXISTS private_producer_job_latest
  ON political_record.record_revisions(record_id,insertion_cursor DESC)
  WHERE kind='source_health' AND provenance->>'parserVersion'='private-publication-job-v1';
COMMIT;
