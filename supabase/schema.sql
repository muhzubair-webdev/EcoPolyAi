-- EcoPolyAI — Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Polybag Plants Table
CREATE TABLE IF NOT EXISTS polybag_plants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_name    TEXT NOT NULL CHECK (plant_name IN ('Cabai', 'Tomat', 'Sawi')),
  polybag_size  TEXT NOT NULL DEFAULT '35cm',
  planted_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  compost_method TEXT NOT NULL CHECK (compost_method IN ('Takakura', 'Pupuk Cair Lindi', 'Kompos Aerob')),
  health_status TEXT NOT NULL DEFAULT 'Sehat',
  last_watered  TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Compost Batches Table
CREATE TABLE IF NOT EXISTS compost_batches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waste_source TEXT NOT NULL,
  weight_kg    NUMERIC(6,2) NOT NULL DEFAULT 1.0,
  method       TEXT NOT NULL CHECK (method IN ('Takakura', 'Pupuk Cair Lindi', 'Kompos Aerob')),
  start_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  status       TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Selesai')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Plant Scans Table
CREATE TABLE IF NOT EXISTS plant_scans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id         UUID REFERENCES polybag_plants(id) ON DELETE SET NULL,
  detected_plant   TEXT NOT NULL,
  symptoms         TEXT NOT NULL DEFAULT '-',
  organic_solution TEXT NOT NULL DEFAULT '-',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('user', 'model')),
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_plant_scans_plant ON plant_scans(plant_id);
CREATE INDEX IF NOT EXISTS idx_plants_created ON polybag_plants(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batches_created ON compost_batches(created_at DESC);

-- Row Level Security (RLS) — open anon access for demo
ALTER TABLE polybag_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE compost_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies: allow anon read & write (suitable for competition demo)
CREATE POLICY "Allow all anon" ON polybag_plants FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON compost_batches FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON plant_scans FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON chat_messages FOR ALL TO anon USING (true) WITH CHECK (true);

-- Sample seed data
INSERT INTO polybag_plants (plant_name, polybag_size, planted_date, compost_method, health_status, notes)
VALUES
  ('Cabai', '35cm', CURRENT_DATE - INTERVAL '42 days', 'Takakura', 'Sehat', 'Mulai berbunga minggu ini'),
  ('Tomat', '40cm', CURRENT_DATE - INTERVAL '28 days', 'Kompos Aerob', 'Perlu Perhatian', 'Daun bawah agak menguning'),
  ('Sawi', '30cm', CURRENT_DATE - INTERVAL '14 days', 'Pupuk Cair Lindi', 'Sehat', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO compost_batches (waste_source, weight_kg, method, start_date, status)
VALUES
  ('Sisa nasi & sayuran', 1.5, 'Takakura', CURRENT_DATE - INTERVAL '21 days', 'Aktif'),
  ('Kulit buah & ampas kopi', 0.8, 'Pupuk Cair Lindi', CURRENT_DATE - INTERVAL '14 days', 'Aktif'),
  ('Daun kering & sisa sayur', 2.0, 'Kompos Aerob', CURRENT_DATE - INTERVAL '30 days', 'Selesai')
ON CONFLICT DO NOTHING;
