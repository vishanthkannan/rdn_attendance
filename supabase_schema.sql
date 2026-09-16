-- ==============================================================================
-- RDN CREATORS - Civil Workers Attendance & Payroll Register
-- Supabase Database Schema
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Worker Groups Table
CREATE TABLE IF NOT EXISTS worker_groups (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Individual Workers Table (e.g. Manson, M-Helper, F-Helper)
CREATE TABLE IF NOT EXISTS workers (
  id VARCHAR(100) PRIMARY KEY,
  group_id VARCHAR(100) REFERENCES worker_groups(id) ON DELETE CASCADE,
  group_name VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  wage NUMERIC(10, 2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Daily Attendance & Borrowed Advances Table
CREATE TABLE IF NOT EXISTS daily_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start VARCHAR(20) NOT NULL, -- e.g. '2026-09-08'
  worker_id VARCHAR(100) REFERENCES workers(id) ON DELETE CASCADE,
  attendance_date VARCHAR(20) NOT NULL, -- e.g. '2026-09-08'
  attendance NUMERIC(4, 2) DEFAULT 0 NOT NULL,
  borrowed NUMERIC(10, 2) DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT uq_worker_date UNIQUE (worker_id, attendance_date)
);

-- 5. Closed / Locked Weeks Table
CREATE TABLE IF NOT EXISTS closed_weeks (
  week_id VARCHAR(20) PRIMARY KEY, -- e.g. '2026-08-25'
  closed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- Row Level Security (RLS) - Allows public/anon API access for site register
-- ==============================================================================

ALTER TABLE worker_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE closed_weeks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous full access for worker_groups
DROP POLICY IF EXISTS "Allow public read worker_groups" ON worker_groups;
DROP POLICY IF EXISTS "Allow public insert worker_groups" ON worker_groups;
DROP POLICY IF EXISTS "Allow public update worker_groups" ON worker_groups;
DROP POLICY IF EXISTS "Allow public delete worker_groups" ON worker_groups;
CREATE POLICY "Allow public read worker_groups" ON worker_groups FOR SELECT USING (true);
CREATE POLICY "Allow public insert worker_groups" ON worker_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update worker_groups" ON worker_groups FOR UPDATE USING (true);
CREATE POLICY "Allow public delete worker_groups" ON worker_groups FOR DELETE USING (true);

-- Allow anonymous full access for workers
DROP POLICY IF EXISTS "Allow public read workers" ON workers;
DROP POLICY IF EXISTS "Allow public insert workers" ON workers;
DROP POLICY IF EXISTS "Allow public update workers" ON workers;
DROP POLICY IF EXISTS "Allow public delete workers" ON workers;
CREATE POLICY "Allow public read workers" ON workers FOR SELECT USING (true);
CREATE POLICY "Allow public insert workers" ON workers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update workers" ON workers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete workers" ON workers FOR DELETE USING (true);

-- Allow anonymous full access for daily_attendance
DROP POLICY IF EXISTS "Allow public read daily_attendance" ON daily_attendance;
DROP POLICY IF EXISTS "Allow public insert daily_attendance" ON daily_attendance;
DROP POLICY IF EXISTS "Allow public update daily_attendance" ON daily_attendance;
DROP POLICY IF EXISTS "Allow public delete daily_attendance" ON daily_attendance;
CREATE POLICY "Allow public read daily_attendance" ON daily_attendance FOR SELECT USING (true);
CREATE POLICY "Allow public insert daily_attendance" ON daily_attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update daily_attendance" ON daily_attendance FOR UPDATE USING (true);
CREATE POLICY "Allow public delete daily_attendance" ON daily_attendance FOR DELETE USING (true);

-- Allow anonymous full access for closed_weeks
DROP POLICY IF EXISTS "Allow public read closed_weeks" ON closed_weeks;
DROP POLICY IF EXISTS "Allow public insert closed_weeks" ON closed_weeks;
DROP POLICY IF EXISTS "Allow public update closed_weeks" ON closed_weeks;
DROP POLICY IF EXISTS "Allow public delete closed_weeks" ON closed_weeks;
CREATE POLICY "Allow public read closed_weeks" ON closed_weeks FOR SELECT USING (true);
CREATE POLICY "Allow public insert closed_weeks" ON closed_weeks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update closed_weeks" ON closed_weeks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete closed_weeks" ON closed_weeks FOR DELETE USING (true);

-- ==============================================================================
-- 6. Enable Realtime Publications & Replica Identity (For Instant Multi-Device Live Sync)
-- ==============================================================================

-- Enable full row replica identity so updates and deletes broadcast complete row payloads
ALTER TABLE worker_groups REPLICA IDENTITY FULL;
ALTER TABLE workers REPLICA IDENTITY FULL;
ALTER TABLE daily_attendance REPLICA IDENTITY FULL;
ALTER TABLE closed_weeks REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE worker_groups;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE workers;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE daily_attendance;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE closed_weeks;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;


