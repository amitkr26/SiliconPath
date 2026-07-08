-- SiliconPath Tier 2 social — db1 (Supabase Primary), per docs/DATABASE.md.
-- Available to ANY signed-up user (progressive disclosure). RLS enforces that a
-- user only touches rows they participate in.

-- ── connections ──────────────────────────────────────────────────────────────
create table if not exists connections (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at   timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
alter table connections enable row level security;
drop policy if exists "connections_visible_to_participants" on connections;
create policy "connections_visible_to_participants" on connections
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists "connections_insert_own_request" on connections;
create policy "connections_insert_own_request" on connections
  for insert with check (auth.uid() = requester_id);
drop policy if exists "connections_update_addressee" on connections;
create policy "connections_update_addressee" on connections
  for update using (auth.uid() = addressee_id) with check (auth.uid() = addressee_id);

-- ── messages (1:1) ───────────────────────────────────────────────────────────
create table if not exists messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body         text not null check (length(body) between 1 and 5000),
  read_at      timestamptz,
  created_at   timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index if not exists messages_thread_idx on messages (sender_id, recipient_id, created_at);
alter table messages enable row level security;
drop policy if exists "messages_visible_to_participants" on messages;
create policy "messages_visible_to_participants" on messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
drop policy if exists "messages_insert_as_sender" on messages;
create policy "messages_insert_as_sender" on messages
  for insert with check (auth.uid() = sender_id);
drop policy if exists "messages_update_recipient_read" on messages;
create policy "messages_update_recipient_read" on messages
  for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- ── company claim flow ───────────────────────────────────────────────────────
-- A real representative claims an auto-generated company page by proving an email
-- on the company domain. Approved claimants may post jobs for that company.
create table if not exists company_claims (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  work_email   text not null,
  status       text not null default 'pending' check (status in ('pending','verified','rejected')),
  created_at   timestamptz not null default now(),
  unique (company_id, user_id)
);
alter table company_claims enable row level security;
drop policy if exists "claims_own" on company_claims;
create policy "claims_own" on company_claims
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
