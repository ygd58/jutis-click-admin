-- Jutis Click Game - Database Setup
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_clicks BIGINT DEFAULT 0,
  xp_balance BIGINT DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'banned'))
);

-- Click sessions table
CREATE TABLE IF NOT EXISTS click_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clicks INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game settings table
CREATE TABLE IF NOT EXISTS game_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- XP transactions table
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clicks_spent BIGINT NOT NULL,
  xp_received BIGINT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO game_settings (key, value) VALUES
  ('points_per_click', '1'),
  ('daily_click_limit', '1000'),
  ('click_cooldown_ms', '0'),
  ('click_to_xp_rate', '100'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- Function to increment total clicks
CREATE OR REPLACE FUNCTION increment_total_clicks(user_id UUID, click_count INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET total_clicks = total_clicks + click_count WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement clicks and increment XP atomically
CREATE OR REPLACE FUNCTION decrement_clicks_and_increment_xp(
  user_id UUID,
  clicks_to_remove BIGINT,
  xp_to_add BIGINT
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET total_clicks = total_clicks - clicks_to_remove,
      xp_balance = xp_balance + xp_to_add
  WHERE id = user_id AND total_clicks >= clicks_to_remove;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- Public policies (for anon key)
CREATE POLICY "Public can read users" ON users FOR SELECT USING (true);
CREATE POLICY "Public can insert click_sessions" ON click_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read game_settings" ON game_settings FOR SELECT USING (true);
CREATE POLICY "Public can read xp_transactions" ON xp_transactions FOR SELECT USING (true);
CREATE POLICY "Public can update own clicks" ON users FOR UPDATE USING (true);

-- Create index on click_sessions for faster daily queries
CREATE INDEX IF NOT EXISTS idx_click_sessions_user_timestamp ON click_sessions(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);