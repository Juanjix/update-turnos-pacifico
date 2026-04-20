-- ============================================================
-- Club Pacífico Tenis — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLE: courts
-- ============================================================
create table if not exists courts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       text not null check (type in ('indoor', 'outdoor')),
  created_at timestamptz default now()
);

-- ============================================================
-- TABLE: bookings
-- ============================================================
create table if not exists bookings (
  id           uuid primary key default gen_random_uuid(),
  court_id     uuid not null references courts(id) on delete cascade,
  date         date not null,
  time_start   time not null,
  time_end     time not null,
  client_name  text not null,
  client_phone text not null,
  status       text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at   timestamptz default now(),

  -- Prevent double booking: same court, same date, overlapping times
  constraint no_overlap exclude using gist (
    court_id with =,
    date with =,
    tsrange(
      (date + time_start)::timestamp,
      (date + time_end)::timestamp,
      '[)'
    ) with &&
  )
  where (status = 'confirmed')
);

-- Index for fast availability queries
create index if not exists idx_bookings_court_date
  on bookings(court_id, date)
  where status = 'confirmed';

-- ============================================================
-- SEED DATA: courts
-- ============================================================
insert into courts (id, name, type) values
  ('11111111-0000-0000-0000-000000000001', 'Cancha 1', 'outdoor'),
  ('11111111-0000-0000-0000-000000000002', 'Cancha 2', 'outdoor'),
  ('11111111-0000-0000-0000-000000000003', 'Cancha 3', 'outdoor'),
  ('11111111-0000-0000-0000-000000000004', 'Cancha 4', 'outdoor'),
  ('11111111-0000-0000-0000-000000000005', 'Cancha 5 (Cubierta)', 'indoor'),
  ('11111111-0000-0000-0000-000000000006', 'Cancha 6 (Cubierta)', 'indoor')
on conflict (id) do nothing;

-- ============================================================
-- RLS Policies (optional but recommended)
-- ============================================================
alter table courts enable row level security;
alter table bookings enable row level security;

-- Allow public read on courts
create policy "courts_public_read" on courts
  for select using (true);

-- Allow public read/insert on bookings (adjust for auth later)
create policy "bookings_public_read" on bookings
  for select using (true);

create policy "bookings_public_insert" on bookings
  for insert with check (true);

create policy "bookings_public_update" on bookings
  for update using (true);
