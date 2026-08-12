// DB grounding for QA remediation (read-only) — live Supabase project.
// Secrets come from env only (repo convention): NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY, e.g. source .env.local before running.
const { createClient } = require("@supabase/supabase-js");

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!URL || !KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (echo both from .env.local into the shell).");
  process.exit(1);
}

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

async function main() {
  const [opps, news, subs, categories, waymo, subTarget] = await Promise.all([
    sb.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true),
    sb.from("news_articles").select("*", { count: "exact", head: true }),
    sb.from("subscribers").select("*", { count: "exact", head: true }),
    sb.from("opportunities").select("category"),
    sb.from("news_articles").select("slug,title").eq("slug", "waymo-extends-driverless-lead"),
    sb.from("subscribers").select("email").eq("email", "qa-audit-test@example.com"),
  ]);

  console.log("active opportunities:", opps.count);
  console.log("news_articles:", news.count);
  console.log("subscribers:", subs.count);

  const counts = {};
  (categories.data || []).forEach((r) => {
    const c = r.category || "(null)";
    counts[c] = (counts[c] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  console.log("distinct categories (top 25):");
  sorted.slice(0, 25).forEach(([c, n]) => console.log(`  "${c}": ${n}`));

  console.log("waymo slug row:", waymo.error ? "ERR " + waymo.error.message : JSON.stringify(waymo.data));
  console.log("qa-audit-test subscriber rows:", subTarget.data ? subTarget.data.length : subTarget.error?.message);
}
main().catch((e) => console.error(e));