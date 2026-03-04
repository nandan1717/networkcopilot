-- ==========================================================
-- Migration: Add event_reactions table for community sentiment
-- ==========================================================
-- This table stores per-user reactions (liked/disliked) for events,
-- identified by a normalized event name for cross-user matching.
-- The combination (user_id, event_name_normalized) is unique
-- so that each user can only have one reaction per event.

CREATE TABLE IF NOT EXISTS event_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_name_normalized TEXT NOT NULL,
  event_name_original TEXT NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('liked', 'disliked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, event_name_normalized)
);

-- Enable RLS for event_reactions
ALTER TABLE event_reactions ENABLE ROW LEVEL SECURITY;

-- Users can insert/update their own reactions
CREATE POLICY "Users can manage their own reactions"
ON event_reactions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- All authenticated users can read all reactions (needed for community sentiment)
CREATE POLICY "Authenticated users can read all reactions"
ON event_reactions FOR SELECT
USING (auth.role() = 'authenticated');

-- Index for fast lookups by normalized event name
CREATE INDEX idx_event_reactions_name ON event_reactions (event_name_normalized);
