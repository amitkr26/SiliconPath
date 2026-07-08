-- SiliconPath VLSI Academy — db1 (Supabase Primary), per docs/DATABASE.md.
-- This is the STRUCTURE only. Content rows (videos) are inserted separately, and
-- ONLY after passing the verified-curation process in docs/ACADEMY_CURATION.md.
-- No video is seeded from assumed knowledge (guardrail #3).

create table if not exists academy_tracks (
  id          text primary key,          -- e.g. 'digital-logic'
  title       text not null,
  summary     text,
  ordinal     int not null,              -- track sequence (1..N)
  created_at  timestamptz not null default now()
);

create table if not exists academy_units (
  id          uuid primary key default gen_random_uuid(),
  track_id    text not null references academy_tracks(id) on delete cascade,
  day_number  int not null,              -- day-wise unit within a track
  title       text not null,
  theory_md   text,                      -- theory summary (markdown)
  practice_md text,                      -- practice questions (markdown)
  lab_md      text,                      -- coding/lab task (markdown)
  ordinal     int not null,
  unique (track_id, day_number)
);

-- Embedded videos. Attribution columns are NOT NULL on purpose: a video cannot be
-- stored without a visible creator name + channel link (guardrail #7). Only the
-- YouTube video id is stored (embedded via official iframe; never rehosted).
create table if not exists academy_videos (
  id             uuid primary key default gen_random_uuid(),
  unit_id        uuid not null references academy_units(id) on delete cascade,
  youtube_id     text not null,
  title          text not null,
  creator_name   text not null,          -- visible attribution (mandatory)
  creator_url    text not null,          -- link to channel (mandatory)
  verified_at    timestamptz,            -- when curation verified this entry
  verified_by    text,                   -- who verified (audit trail)
  ordinal        int not null default 0
);

-- Track-level checkpoint (assessment + capstone) gates advancement.
create table if not exists academy_checkpoints (
  id          uuid primary key default gen_random_uuid(),
  track_id    text not null references academy_tracks(id) on delete cascade,
  kind        text not null check (kind in ('assessment','capstone')),
  prompt_md   text not null,
  pass_pct    int not null default 70
);

-- Per-user progress. For anonymous users this table is NOT used — progress is kept
-- in localStorage client-side and can be merged on signup.
create table if not exists academy_progress (
  user_id       uuid not null references auth.users(id) on delete cascade,
  unit_id       uuid not null references academy_units(id) on delete cascade,
  completed_at  timestamptz,
  primary key (user_id, unit_id)
);

create table if not exists academy_checkpoint_results (
  user_id       uuid not null references auth.users(id) on delete cascade,
  checkpoint_id uuid not null references academy_checkpoints(id) on delete cascade,
  score_pct     int not null,
  passed        boolean not null,
  taken_at      timestamptz not null default now(),
  primary key (user_id, checkpoint_id)
);

alter table academy_progress enable row level security;
alter table academy_checkpoint_results enable row level security;

drop policy if exists "academy_progress_own" on academy_progress;
create policy "academy_progress_own" on academy_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "academy_results_own" on academy_checkpoint_results;
create policy "academy_results_own" on academy_checkpoint_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public content tables are readable by everyone (anonymous browse); no RLS needed
-- for read, but writes should only happen via service-role curation scripts.
