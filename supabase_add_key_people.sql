-- ==========================================================
-- Migration: Add key_people column to matched_events table
-- ==========================================================
-- Stores up to 3 verified key people (speakers/organizers)
-- per event as a JSONB array with name, role, company, linkedinUrl.

ALTER TABLE matched_events
ADD COLUMN IF NOT EXISTS key_people JSONB DEFAULT '[]'::jsonb;
