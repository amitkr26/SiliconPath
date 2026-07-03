import pkg from "pg";
const { Client } = pkg;

const SQL = `
-- Opportunities table
create table if not exists opportunities (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  organization text not null,
  category text not null,
  location text,
  stipend text,
  deadline date,
  eligibility text,
  description text,
  apply_link text,
  source_url text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  tags text[]
);

-- News articles table
create table if not exists news_articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  summary text,
  source text,
  source_url text,
  published_at timestamp with time zone,
  image_url text,
  tags text[],
  created_at timestamp with time zone default now()
);

-- Email subscribers table
create table if not exists subscribers (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  keywords text[],
  categories text[],
  created_at timestamp with time zone default now(),
  is_active boolean default true
);

-- Enable RLS
alter table opportunities enable row level security;
alter table news_articles enable row level security;
alter table subscribers enable row level security;

-- RLS policies (idempotent)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Public can read opportunities') then
    create policy "Public can read opportunities" on opportunities for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Public can read news') then
    create policy "Public can read news" on news_articles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Anyone can subscribe') then
    create policy "Anyone can subscribe" on subscribers for insert with check (true);
  end if;
end $$;
`;

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("Missing SUPABASE_DB_URL environment variable");
  process.exit(1);
}

const client = new Client({ connectionString });

try {
  await client.connect();
  console.log("Connected to Supabase database");

  const statements = SQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await client.query(stmt + ";");
      console.log(`✓ Executed: ${stmt.substring(0, 60)}...`);
    } catch (err) {
      console.error(`✗ Error: ${err.message}`);
    }
  }

  console.log("\n✅ Database setup complete!");
} catch (err) {
  console.error("Connection failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
