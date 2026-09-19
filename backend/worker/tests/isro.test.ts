import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanTitle,
  slugify,
  normalizeUrl,
  normalizeCategory,
  toDeadlineDate,
  GARBAGE_TITLE_PATTERNS,
} from "../src/scrapers/opportunity-utils.js";
import { resolveOrganization, extractBoardToken, looksLikePersonName } from "../src/scrapers/org-resolve.js";
import { parseISROCareersHtml, scrapeISRO } from "../src/scrapers/isro.js";
import { runIsroScrape } from "../src/run-isro-scrape.js";
// Replica-vs-production parity: import the REAL frontend scraper module
// (no Next.js aliases — it only imports cheerio + a type) and feed both the
// same frozen HTML.
import { scrapeISRO as frontendScrapeISRO } from "../../../frontend/src/lib/scrapers/isro-scraper.ts";

// ---------- frozen fixture (mirrors the live careers-page structure) ----------

const FIXTURE_HTML = `<html><body><table>
  <tr><td><a href="ICRB_Recruitment11.html">CORRIGENDUM 2: ADVT. NO. ISRO:ICRB:01(A-JPA):2026 dated 27-07-2026 - Recruitment to the post of Assistants, Junior Personal Assistant (JPA) and Stenographer</a></td></tr>
  <tr><td><a href="ICRB_Recruitment9.html">Schedule of Interviews for the post of Scientist/Engineer 'SC' (Mechanical) - BE002 - Phase-III against Advertisement No. ICRB:02(EMC):2025</a></td></tr>
  <tr><td><a href="LPSCRecruitment13.html">Advt No. LPSC/02/2026 dated 15.08.2026 Recruitment to the post of Technical Assistant, Technician 'B', Draughtsman and Store Keeper</a> <a href="#">Read More</a></td></tr>
  <tr><td><a href="URSCRecruitment12.html">Advt. No. URSC:03:2026 Dated:29.07.2026 - INVITING ONLINE APPLICATIONS FOR ENGAGEMENT OF CANDIDATES AS GRADUATE APPRENTICE</a></td></tr>
  <tr><td><a href="NRSCRecruitment2026_1.html">Advt. No. NRSC/RMT/1/2026 Dated.01.08.2026 Recruitment to the post of Temporary Research Personnel (Research Scientist/Research Assistant)</a></td></tr>
  <tr><td><a href="https://www.isro.gov.in/HSFCRecruitment2026_1.html">Advt. No. HSFC:01:RMT:2026 Dated.10.08.2026 Recruitment to the post of Scientist/Engineer - SD</a></td></tr>
  <tr><td><a href="List_of_Selected_Candidates.html">List of Selected Candidates for the post of Scientist/Engineer SC against Advt. No. ICRB:01:2025</a></td></tr>
  <tr><td><a href="Home.html">Home</a></td></tr>
  <tr><td><a href="X.html">Short</a></td></tr>
  <tr><td><a href="FallbackFile.html"></a>Recruitment of Scientific Assistant on contract basis for ISRO Bengaluru centre</td></tr>
  <tr><td><a href="Garbage.html">Click here for the latest recruitment news and updates</a></td></tr>
</table></body></html>`;

// ---------- parse-level behaviour ----------

test("parse: result/corrigendum/nav/short rows are filtered, real listings kept", () => {
  const rows = parseISROCareersHtml(FIXTURE_HTML);
  assert.equal(rows.length, 7, "7 rows survive the parse filters");
  assert.ok(rows.every((r) => !/corrigendum|list of selected/i.test(r.title)), "no result/corrigendum rows");
  assert.ok(rows.every((r) => !/home|contact|sitemap/i.test(r.title)), "no navigation rows");
  const lpsc = rows.find((r) => r.source_url.includes("LPSCRecruitment13"));
  assert.ok(lpsc, "LPSC row kept");
  assert.equal(lpsc.category, "Govt Job");
  assert.equal(lpsc.deadline, "15.08.2026");
  assert.equal(lpsc.apply_link, "https://www.isro.gov.in/LPSCRecruitment13.html");
  const fallback = rows.find((r) => r.source_url.includes("FallbackFile"));
  assert.equal(fallback.title, "Recruitment of Scientific Assistant on contract basis for ISRO Bengaluru centre");
  assert.equal(fallback.location, "Bengaluru");
});

test("parse: 20-row cap is enforced", () => {
  const many = Array.from({ length: 25 }, () => `<tr><td><a href="A${Math.random()}.html">Advt No. X/01/2026 dated 15.08.2026 Recruitment to the post of Technical Assistant at a long enough title</a></td></tr>`).join("\n");
  const rows = parseISROCareersHtml(`<table>${many}</table>`);
  assert.equal(rows.length, 20);
});

test("parse: transport failure throws (worker exits non-zero), empty page parses to zero rows", async () => {
  await assert.rejects(() => scrapeISRO({ fetchHtml: async () => { throw new Error("HTTP 500"); } }), /HTTP 500/);
  const rows = await scrapeISRO({ fetchHtml: async () => "<html><body><p>no table</p></body></html>" });
  assert.equal(rows.length, 0);
});

// ---------- parity: replica parser == production frontend parser ----------

test("parity: replica and production frontend parse identical output on frozen HTML", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(FIXTURE_HTML, { status: 200 })) as typeof fetch;
  try {
    const frontendOut = await frontendScrapeISRO();
    const replicaOut = await scrapeISRO({ fetchHtml: async () => FIXTURE_HTML });
    assert.equal(frontendOut.length, 7);
    assert.deepEqual(replicaOut, frontendOut);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ---------- pure helpers (ported 1:1) ----------

test("utils: cleanTitle rules match production", () => {
  assert.equal(cleanTitle("ISRO invites applications for the post of Scientist/Engineer on contract basis", "ISRO"), "Scientist/Engineer — ISRO");
  assert.equal(cleanTitle("Junior Research Fellow in VLSI at CEERI", "ISRO"), "JRF — CEERI");
  assert.equal(cleanTitle("Senior Research Fellow at LPSC", "ISRO"), "SRF — LPSC");
  assert.equal(cleanTitle("Technician B - apply by 31 August 2026", "ISRO"), "Technician B");
  assert.equal(cleanTitle("Engineer)Full-time role", "ISRO"), "Engineer) Full-time role");
});

test("utils: slugify + normalizeUrl", () => {
  assert.equal(slugify("Scientist/Engineer 'SC' — LPSC"), "scientist-engineer-sc-lpsc");
  assert.equal(normalizeUrl("https://www.isro.gov.in/Page.html?utm_source=a&x=1&utm_medium=b"), "https://www.isro.gov.in/Page.html?x=1");
  assert.equal(normalizeUrl("https://www.isro.gov.in/Page/"), "https://www.isro.gov.in/Page");
});

test("utils: category + deadline mapping match the live CHECK contract", () => {
  assert.equal(normalizeCategory("Govt Job"), "government");
  assert.equal(normalizeCategory("JRF"), "jrf");
  assert.equal(normalizeCategory("Fellowship"), "fellowship");
  assert.equal(normalizeCategory("Mystery"), "government");
  assert.equal(toDeadlineDate("15.08.2026"), "2026-08-15");
  assert.equal(toDeadlineDate("27-07-2026"), null, "frontend's [./] regex never accepts dashes — parity");
  assert.equal(toDeadlineDate("2026-08-30"), "2026-08-30");
  assert.equal(toDeadlineDate("soon"), null);
  assert.ok(GARBAGE_TITLE_PATTERNS.test("Click here for details"));
  assert.ok(!GARBAGE_TITLE_PATTERNS.test("Technical Assistant recruitment 2026"));
  assert.ok(GARBAGE_TITLE_PATTERNS.test("Research Personnel vacancy"), "production bug: 'search' matches inside 'Research' — parity kept");
});

test("org-resolve: isro.gov.in listings resolve to the ISRO org row by host label", () => {
  const orgs = [{ id: "org-isro", name: "ISRO", slug: "isro", website: null }];
  const res = resolveOrganization({
    sourceUrl: "https://www.isro.gov.in/LPSCRecruitment13.html",
    title: "Advt No. LPSC/02/2026",
    name: "ISRO",
    organizations: orgs,
  });
  assert.equal(res.organizationId, "org-isro");
  assert.equal(res.confidence, "high");
});

test("org-resolve: person-name guard and domain fallback behave as production", () => {
  assert.equal(looksLikePersonName("Sadia Munir"), true);
  assert.equal(extractBoardToken("https://nvidia.wd3.myworkdayjobs.com/x"), "nvidia");
  const none = resolveOrganization({ sourceUrl: "https://x.io/a", title: "Some post", name: "Sadia Munir", organizations: [] });
  assert.equal(none.confidence, "none");
  assert.equal(none.organizationId, null);
  const domain = resolveOrganization({ sourceUrl: "https://www.isro.gov.in/a.html", title: "Post", name: "ISRO", organizations: [] });
  assert.equal(domain.confidence, "medium");
  assert.equal(domain.name, "ISRO");
});

// ---------- orchestrator pipeline (FakeDb) ----------

const ISRO_ORG = { id: "org-isro", name: "ISRO", slug: "isro", website: null };

interface Op { kind: string; table: string; rows?: unknown[]; payload?: unknown }

class Chain {
  insertRows: unknown[] | null = null;
  private query: { in: [string, unknown[]] | null; ilike: [string, unknown] | null; eq: [string, unknown] | null } =
    { in: null, ilike: null, eq: null };
  constructor(private db: FakeDb, private table: string) {}
  select(_cols: string): Chain { return this; }
  in(col: string, vals: unknown[]): Chain { this.query.in = [col, vals]; return this; }
  ilike(col: string, val: unknown): Chain { this.query.ilike = [col, val]; return this; }
  eq(col: string, val: unknown): Chain { this.query.eq = [col, val]; return this; }
  limit(_n: number): Chain { return this; }
  insert(rows: unknown[]): Chain {
    this.db.ops.push({ kind: "insert", table: this.table, rows } satisfies Op);
    this.insertRows = rows;
    for (const r of rows) this.db.afterInsert(this.table, r as Record<string, unknown>);
    return this;
  }
  update(payload: unknown): Chain {
    this.db.ops.push({ kind: "update", table: this.table, payload } satisfies Op);
    return this;
  }
  then<T>(res: (v: { data: unknown; error: unknown }) => T): Promise<T> {
    return Promise.resolve({ data: this.rows(), error: null }).then(res);
  }
  async maybeSingle(): Promise<{ data: unknown; error: unknown }> {
    return { data: this.rows()[0] ?? null, error: null };
  }
  async single(): Promise<{ data: unknown; error: unknown }> {
    return { data: this.rows()[0] ?? null, error: null };
  }
  private rows(): unknown[] {
    if (this.insertRows) return this.insertRows;
    return this.db.answer(this.table, this.query);
  }
}

class FakeDb {
  ops: Op[] = [];
  orgRows: typeof ISRO_ORG[] = [ISRO_ORG];
  existingSourceUrls: string[] = [];
  existingTitles: string[] = [];
  existingSlugs: string[] = [];
  sourceRows: Array<{ id: string; name: string; consecutive_failures: number }> = [];
  private seq = 0;

  afterInsert(table: string, row: Record<string, unknown>): void {
    this.seq++;
    row.id = row.id ?? `${table}-${this.seq}`;
    if (table === "opportunities") {
      this.existingSourceUrls.push(String(row.source_url));
      this.existingTitles.push(String(row.title));
      this.existingSlugs.push(String(row.slug));
    }
    if (table === "scrape_sources") {
      this.sourceRows.push({ id: String(row.id), name: String(row.name), consecutive_failures: 0 });
    }
  }

  answer(table: string, q: { in: [string, unknown[]] | null; ilike: [string, unknown] | null; eq: [string, unknown] | null }): unknown[] {
    if (table === "organizations") return this.orgRows;
    if (table === "opportunities") {
      if (q.in) {
        const [col, vals] = q.in;
        if (col === "source_url" && vals.some((v) => this.existingSourceUrls.includes(String(v)))) return [{ id: "dup-url" }];
      }
      if (q.ilike) {
        const [, val] = q.ilike;
        if (this.existingTitles.some((t) => t.toLowerCase() === String(val).toLowerCase())) return [{ id: "dup-title" }];
      }
      if (q.eq) {
        const [, val] = q.eq;
        if (this.existingSlugs.includes(String(val))) return [{ id: "dup-slug" }];
      }
      return [];
    }
    if (table === "scrape_sources" && q.eq) {
      const [, val] = q.eq;
      return this.sourceRows.filter((s) => s.name === String(val));
    }
    return [];
  }

  from(table: string): Chain {
    return new Chain(this, table);
  }
}

test("pipeline: insert contract matches the live schema (pending status, mapped category, normalized urls)", async () => {
  const db = new FakeDb();
  const summary = await runIsroScrape({ client: db as any, fetchHtml: async () => FIXTURE_HTML });
  assert.equal(summary.fetched, 7);
  assert.equal(summary.inserted, 5, "garbage row + 'Research' row (search-substring bug) skipped by the pipeline");
  assert.equal(summary.skipped, 2);
  assert.equal(summary.duplicates, 0);

  const inserts = db.ops.filter((o) => o.kind === "insert" && o.table === "opportunities").map((o) => o.rows![0] as Record<string, unknown>);
  assert.equal(inserts.length, 5);
  for (const row of inserts) {
    assert.equal(row.verification_status, "pending", "pending is the only CHECK-valid fresh status");
    assert.equal(row.source_type, "scraped");
    assert.equal(row.is_active, true);
    assert.equal(row.organization_id, "org-isro");
    assert.equal(row.salary_range, null);
  }
  const lpsc = inserts.find((r) => r.source_url === "https://www.isro.gov.in/LPSCRecruitment13.html")!;
  assert.equal(lpsc.category, "government");
  assert.equal(lpsc.deadline, "2026-08-15");
  assert.equal(lpsc.apply_url, "https://www.isro.gov.in/LPSCRecruitment13.html");
  const apprentice = inserts.find((r) => r.source_url === "https://www.isro.gov.in/URSCRecruitment12.html")!;
  assert.equal(apprentice.category, "fellowship");
  const absolute = inserts.find((r) => r.source_url === "https://www.isro.gov.in/HSFCRecruitment2026_1.html")!;
  assert.equal(absolute.apply_url, "https://www.isro.gov.in/HSFCRecruitment2026_1.html");
});

test("pipeline: run twice inserts zero duplicates (source_url dedup is the contract)", async () => {
  const db = new FakeDb();
  const first = await runIsroScrape({ client: db as any, fetchHtml: async () => FIXTURE_HTML });
  assert.equal(first.inserted, 5);
  const second = await runIsroScrape({ client: db as any, fetchHtml: async () => FIXTURE_HTML });
  assert.equal(second.inserted, 0);
  assert.equal(second.duplicates, 5);
  assert.equal(second.skipped, 2, "garbage + Research rows still skipped");
});

test("pipeline: health persistence creates scrape_sources + scrape_runs with the real source id", async () => {
  const db = new FakeDb();
  await runIsroScrape({ client: db as any, fetchHtml: async () => FIXTURE_HTML });
  const srcInsert = db.ops.find((o) => o.kind === "insert" && o.table === "scrape_sources") as { rows: Array<{ name: string; adapter: string; category: string }> };
  assert.equal(srcInsert.rows[0].name, "ISRO");
  assert.equal(srcInsert.rows[0].adapter, "html");
  assert.equal(srcInsert.rows[0].category, "opportunity");
  const runInsert = db.ops.find((o) => o.kind === "insert" && o.table === "scrape_runs") as { rows: Array<{ source_id: string; status: string; results_count: number }> };
  assert.ok(runInsert, "scrape_runs row persisted");
  assert.equal(runInsert.rows[0].source_id, srcInsert.rows[0].id, "real source id (not the source name)");
  assert.equal(runInsert.rows[0].status, "success");
  assert.equal(runInsert.rows[0].results_count, 7);
});

test("pipeline: existing scrape_sources row is updated, not duplicated", async () => {
  const db = new FakeDb();
  db.sourceRows.push({ id: "src-existing", name: "ISRO", consecutive_failures: 0 });
  await runIsroScrape({ client: db as any, fetchHtml: async () => FIXTURE_HTML });
  assert.ok(db.ops.some((o) => o.kind === "update" && o.table === "scrape_sources"), "update path used when the source exists");
  assert.ok(!db.ops.some((o) => o.kind === "insert" && o.table === "scrape_sources"), "no duplicate scrape_sources row");
  const runInsert = db.ops.find((o) => o.kind === "insert" && o.table === "scrape_runs") as { rows: Array<{ source_id: string }> };
  assert.equal(runInsert.rows[0].source_id, "src-existing");
  const update = db.ops.find((o) => o.kind === "update" && o.table === "scrape_sources") as { payload: any };
  assert.equal(update.payload.total_runs, 1, "total_runs increments on the existing source");
  assert.equal(update.payload.total_results, 7, "total_results sums the fetched row count");
});