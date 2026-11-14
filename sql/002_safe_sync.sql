-- Additive and repeatable. Run AFTER 001_pausesaves.sql; never resets saves.
BEGIN;
ALTER TABLE pause_user_saves
  ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_request_id UUID,
  ADD COLUMN IF NOT EXISTS last_payload_hash TEXT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='pause_snapshot_size' AND conrelid='pause_user_saves'::regclass) THEN
    ALTER TABLE pause_user_saves ADD CONSTRAINT pause_snapshot_size CHECK (octet_length(snapshot::text) <= 524288) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='pause_revision_valid' AND conrelid='pause_user_saves'::regclass) THEN
    ALTER TABLE pause_user_saves ADD CONSTRAINT pause_revision_valid CHECK (revision BETWEEN 0 AND 9007199254740990);
  END IF;
END $$;
-- NOT VALID keeps previously oversized records readable; new writes are bounded.
REVOKE ALL ON TABLE pause_user_saves FROM PUBLIC;
COMMIT;
