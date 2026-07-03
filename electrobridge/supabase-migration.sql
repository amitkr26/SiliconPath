-- ElectroBridge Database Migration
-- Run this in Supabase SQL Editor

-- Track apply clicks
alter table opportunities add column if not exists apply_clicks integer default 0;

-- Add posted_at for "X days ago" display  
alter table opportunities add column if not exists posted_at timestamp with time zone default now();

-- Telegram subscribers
create table if not exists telegram_subscribers (
  id uuid default gen_random_uuid() primary key,
  chat_id text unique not null,
  keywords text[],
  categories text[],
  created_at timestamp with time zone default now(),
  is_active boolean default true
);

-- Application calendar exports tracking
create table if not exists calendar_exports (
  id uuid default gen_random_uuid() primary key,
  opportunity_id uuid references opportunities(id),
  exported_at timestamp with time zone default now()
);

-- RLS policies for new tables
alter table telegram_subscribers enable row level security;
create policy "Service role only" on telegram_subscribers using (false);

-- Update existing rows to have a posted_at value
update opportunities set posted_at = created_at where posted_at is null;
