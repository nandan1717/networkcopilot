-- 1. Create User Profiles Table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name text,
  address text,
  contact jsonb,
  gpa text,
  skills jsonb,
  summary text,
  experiences jsonb,
  education jsonb,
  projects jsonb,
  volunteer jsonb,
  raw_resume jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile" 
ON user_profiles FOR ALL 
USING (auth.uid() = id);

-- 2. Drop the old anonymous matched_events table
DROP TABLE IF EXISTS matched_events;

-- Recreate Matched Events Table with user_id
CREATE TABLE matched_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  "eventName" text NOT NULL,
  location text NOT NULL,
  pitch text NOT NULL,
  date text,
  time text,
  link text,
  source text,
  ai_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for matched_events
ALTER TABLE matched_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own events" 
ON matched_events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own events" 
ON matched_events FOR SELECT 
USING (auth.uid() = user_id);
