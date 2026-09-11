// P1 (v2): org backfill via deterministic host-domain match.
// organizations.website host === host(source_url) or host(apply_url).
// Dry run by default; --apply updates organization_id.
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const env = fs.readFileSync("/workspaces/BerojgarDegreeWala/frontend/.env.local", "utf8")
  .split("\n").reduce((a, l) => { const m = l.match(/^([A-Z_]+)=(.*)/); if (m) a[m[1]] = m[2]; return a; }, {});
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes("--apply");

const host = (u) => {
  try { return (new URL(u).hostname || "").replace(/^www\./, "").toLowerCase(); } catch { return ""; }
};

(async () => {
  const all = [];
  let from = 0;
  for (;;) {
    const { data, error } = await db.from("opportunities")
      .select("id, organization_id, source_url, apply_url, title")
      .range(from, from + 999);
    if (error) throw error;
    all.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  const { data: orgs } = await db.from("organizations").select("id, name, website, slug");
  const orgByHost = new Map();
  for (const o of orgs) {
    if (o.website) {
      const h = host(o.website);
      if (h && !orgByHost.has(h)) orgByHost.set(h, o);
    }
  }

  const rowsWithUrl = all.filter((o) => (o.source_url || o.apply_url));
  const matched = [];
  for (const o of rowsWithUrl) {
    if (o.organization_id) continue;
    for (const u of [o.source_url, o.apply_url]) {
      const h = host(u);
      const org = h && orgByHost.get(h);
      if (org) { matched.push({ id: o.id, url: u, orgId: org.id, orgName: org.name, title: o.title }); break; }
    }
  }
  const stillNull = all.length - matched.length - all.filter((o) => o.organization_id).length;

  console.log("orgs with website:", orgs.filter((o) => o.website).length, "/", orgs.length);
  console.log("opportunities with any URL:", rowsWithUrl.length);
  console.log("DOMAIN-MATCHED (deterministic):", matched.length);
  console.log("remaining without org link:", stillNull);

  const byOrg = {};
  for (const m of matched) byOrg[m.orgName] = (byOrg[m.orgName] || 0) + 1;
  console.log("\nTop matches:");
  Object.entries(byOrg).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([n, c]) => console.log(`  ${n}: ${c}`));
  console.log("\nSamples:");
  matched.slice(0, 5).forEach((m) => console.log(`  "${m.title.slice(0, 60)}" ${m.url} -> ${m.orgName}`));

  if (APPLY && matched.length) {
    const byOrgId = {};
    for (const m of matched) (byOrgId[m.orgId] = byOrgId[m.orgId] || []).push(m.id);
    let updated = 0, errors = 0;
    for (const [orgId, ids] of Object.entries(byOrgId)) {
      const { error } = await db.from("opportunities").update({ organization_id: orgId }).in("id", ids);
      if (error) { errors++; console.error("  err", error.message); } else updated += ids.length;
    }
    console.log(`\nApplied: ${updated} rows updated (${errors} batch errors)`);
  } else {
    console.log("\n(dry run — no changes)");
  }
})().catch((e) => console.log("FATAL", e.message));