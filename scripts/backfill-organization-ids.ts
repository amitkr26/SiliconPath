/**
 * P0.3 backfill — evidence-gated organization_id assignment (Phase 1.4).
 *
 * Usage (from frontend/):  node scripts/backfill-organization-ids.ts          # dry-run
 *                          node scripts/backfill-organization-ids.ts --apply  # write
 *
 * Only assigns organization_id when the resolver finds real evidence
 * (domain/ATS-token/name/title match against the organizations table).
 * Never guesses, never invents orgs, idempotent (skips already-assigned rows).
 * Person-name strings ("Sadia Munir") are rejected by the resolver guard.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolveOrganization } from "../src/lib/organizations/resolve.ts";

const APPLY = process.argv.includes("--apply");
const BATCH = 200;

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .split("\n")
  .reduce((a, l) => {
    const m = l.match(/^([A-Z_]+)=(.*)/);
    if (m) a[m[1]] = m[2].trim();
    return a;
  }, {} as Record<string, string>);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fetchAll<T>(table: string, select: string, extra?: (q: any) => any): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;
  while (true) {
    let q = supabase.from(table).select(select).range(offset, offset + 499);
    if (extra) q = extra(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table} fetch: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as T[]));
    offset += 500;
  }
  return rows;
}

async function main() {
  const { data: orgRows } = await supabase.from("organizations").select("id, name, slug, website");
  const orgList = orgRows ?? [];
  console.log(`orgs in table: ${orgList.length}`);

  const orgless = await fetchAll<{ id: string; title: string; source_url: string | null }>(
    "opportunities",
    "id, title, source_url",
    (q) => q.is("organization_id", null)
  );
  console.log(`orgless opportunities: ${orgless.length} (${APPLY ? "APPLY MODE" : "dry-run"})`);

  const toAssign: { id: string; orgId: string; orgName: string; via: string }[] = [];
  const unresolved: { id: string; title: string; source_url: string | null }[] = [];

  for (const opp of orgless) {
    const r = resolveOrganization({
      sourceUrl: opp.source_url,
      title: opp.title,
      name: null,
      organizations: orgList,
    });
    if (r.organizationId) toAssign.push({ id: opp.id, orgId: r.organizationId, orgName: r.name ?? "?", via: r.confidence });
    else unresolved.push(opp);
  }

  const byOrg = new Map<string, number>();
  for (const a of toAssign) byOrg.set(a.orgName, (byOrg.get(a.orgName) ?? 0) + 1);
  console.log(`\nresolvable: ${toAssign.length} (${((toAssign.length / orgless.length) * 100).toFixed(1)}%)`);
  console.log("top assigned orgs:");
  [...byOrg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
    .forEach(([name, n]) => console.log(`  ${name}: ${n}`));

  const byDomain = new Map<string, number>();
  for (const u of unresolved) {
    try { const h = new URL(u.source_url ?? "").hostname; byDomain.set(h, (byDomain.get(h) ?? 0) + 1); }
    catch { byDomain.set("(no url)", (byDomain.get("(no url)") ?? 0) + 1); }
  }
  console.log(`\nunresolved: ${unresolved.length} — top domains:`);
  [...byDomain.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
    .forEach(([d, n]) => console.log(`  ${d}: ${n}`));

  if (APPLY && toAssign.length > 0) {
    let updated = 0;
    const byOrgId = new Map<string, { id: string }[]>();
    for (const a of toAssign) {
      const list = byOrgId.get(a.orgId) ?? [];
      list.push({ id: a.id });
      byOrgId.set(a.orgId, list);
    }
    for (const [orgId, ids] of byOrgId) {
      for (let i = 0; i < ids.length; i += BATCH) {
        const batchIds = ids.slice(i, i + BATCH).map((b) => b.id);
        const { error } = await supabase
          .from("opportunities")
          .update({ organization_id: orgId })
          .in("id", batchIds);
        if (error) {
          console.error(`batch update error (${orgId}, offset ${i}): ${error.message}`);
        } else {
          updated += batchIds.length;
        }
      }
    }
    console.log(`\nupdated: ${updated} opportunities`);

    const { count: remaining } = await supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .is("organization_id", null);
    console.log(`orgless after backfill: ${remaining ?? "?"}`);
  } else {
    console.log("\n(dry-run — re-run with --apply to write)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
