-- Run this in Supabase SQL Editor to add self-paced mode support
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'live'
  CHECK (mode IN ('live', 'self_paced'));
