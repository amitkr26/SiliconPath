-- SiliconPath user layer — db1 (Supabase Primary), per docs/DATABASE.md.
-- Single-source-of-truth design: profile AND resume read/write the SAME canonical
-- fields. There is no separate resume store and no sync job (a deliberate decision
-- — see docs/DECISIONS.md). The downloadable resume is a generated output.

create table if not exists user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  headline     text,
  location     text,
  about        text,
  -- Canonical structured fields (shared by profile view + resume builder):
  education    jsonb not null default '[]',   -- [{institution, degree, field, start, end, grade}]
  experience   jsonb not null default '[]',   -- [{org, title, start, end, summary, tools}]
  skills       jsonb not null default '[]',   -- ["SystemVerilog", "UVM", ...]
  projects     jsonb not null default '[]',   -- [{name, summary, link}]
  publications jsonb not null default '[]',   -- [{title, venue, year, link}]
  -- Domain-specific fields the spec calls for (beyond generic LinkedIn):
  fab_tool_experience jsonb not null default '[]',
  patents      jsonb not null default '[]',
  pi_lab_affiliation  text,
  gate_net_status     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Row Level Security: a user can read/write only their own profile row.
alter table user_profiles enable row level security;

drop policy if exists "profiles_select_own" on user_profiles;
create policy "profiles_select_own" on user_profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_upsert_own" on user_profiles;
create policy "profiles_insert_own" on user_profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on user_profiles;
create policy "profiles_update_own" on user_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row on signup.
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
