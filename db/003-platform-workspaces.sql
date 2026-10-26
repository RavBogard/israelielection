BEGIN;
ALTER TABLE political_record.record_revisions DROP CONSTRAINT IF EXISTS record_revisions_kind_check;
ALTER TABLE political_record.record_revisions ADD CONSTRAINT record_revisions_kind_check CHECK(kind IN (
 'election','entity','proposal','mandate_attempt','claim','event','snapshot','publication','edition','source_health',
 'parliamentary_membership','bill','bill_version','roll_call','indicator_observation',
 'commitment','commitment_rubric','methodology','government','source_contract',
 'election_announcement','election_workspace','election_activation','capability_attestation'
));
COMMIT;
