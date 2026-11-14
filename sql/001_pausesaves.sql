-- Run using Neon Console SQL Editor after project creation.
-- User identity comes exclusively from a server-verified Google ID token.
CREATE TABLE IF NOT EXISTS pause_user_saves (
  google_sub TEXT PRIMARY KEY,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pause_snapshot_object CHECK (jsonb_typeof(snapshot) = 'object')
);
CREATE INDEX IF NOT EXISTS pause_user_saves_updated_at_idx ON pause_user_saves(updated_at);
