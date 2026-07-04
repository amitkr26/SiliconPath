# Content Sources & Scraping

> How SiliconPath discovers, fetches, filters, and deduplicates semiconductor & electronics opportunities from across the web.

---

## 1. The Three-Tier Source Priority

Sources are classified into three tiers based on reliability, data quality, and update frequency. Higher-tier sources are preferred when deduplication encounters the same opportunity from multiple sources.

### Tier 1 — ATS / Official APIs (Highest Priority)

Direct integrations with Applicant Tracking Systems (ATS) and official recruitment portals. These provide structured, authoritative data with minimal parsing overhead.

**Examples:** Intel Careers API, TSMC Careers, NVIDIA ATS, ISRO Careers, DRDO Vacancies, CSIR Recruitment

**Rationale:** Official sources guarantee authenticity, include structured fields (salary, location, deadlines), and have the lowest failure rate. A Tier-1 entry always overrides a Tier-2 or Tier-3 duplicate.

### Tier 2 — Aggregator APIs

Job-board and aggregator APIs that consolidate listings from multiple employers. Data quality is good but may lag behind the official source.

**Examples:** Adzuna, USAJobs, RemoteOK, Arbeitnow, The Muse, Academic Positions, Jobs.ac.uk, Scholarship Roof

**Rationale:** Aggregators cover gaps that official APIs miss (e.g., startups, international roles, scholarships). They are the fallback when no Tier-1 source exists for a given opportunity.

### Tier 3 — RSS & HTML Scraping (Lowest Priority)

RSS feeds and scraped HTML pages. These require parsing, are prone to break on layout changes, and often lack structured metadata.

**Examples:** IEEE Spectrum RSS, Semiconductor Engineering RSS, EE Times RSS, ISRO Careers HTML scrape, CSIR RSS

**Rationale:** RSS/HTML fills the long tail of niche sources (news, government announcements). All Tier-3 entries go through the verification pipeline before being shown to users.

---

## 2. The Do-Not-Scrape List

The following sources are **explicitly excluded** from all scraping activity:

| Source | Reason |
|---|---|
| LinkedIn Jobs | ToS prohibits automated scraping; legal risk; IP blocks |
| Indeed | Aggressive anti-scraping measures; ToS violation |
| Glassdoor | ToS prohibits scraping; legal risk |

These platforms are valuable for job seekers but cannot be legally or reliably scraped. Users are encouraged to search them independently.

---

## 3. Current Target Sources

### Tier 1 — ATS / Official APIs (Companies)

Intel, TSMC, Samsung Semiconductor, Qualcomm, NVIDIA, Texas Instruments, Analog Devices, Micron, SK Hynix, Broadcom, MediaTek, STMicroelectronics, Infineon, NXP, Renesas, ON Semiconductor, GlobalFoundries, Applied Materials, ASML, Lam Research, KLA, Arm, Synopsys, Cadence, Marvell, Skyworks, Qorvo, Tata Electronics

### Tier 1 — ATS / Official APIs (Government & Institutions)

ISRO (isro.gov.in), DRDO (drdo.gov.in), CSIR labs (csir.res.in), BARC, DAE, MeitY, SCL Mohali

### Tier 1 — University EE Departments

MIT, Stanford, UC Berkeley, Caltech, Georgia Tech, ETH Zurich, EPFL, NUS, IIT Bombay, IIT Delhi, IIT Madras, IIT Kanpur, IISc, IIST, TIFR, IIIT Hyderabad, BITS Pilani

### Tier 2 — Aggregator APIs

Adzuna, USAJobs, RemoteOK, Arbeitnow, The Muse, Academic Positions, Jobs.ac.uk, Scholarship Roof

### Tier 3 — RSS Feeds (News)

IEEE Spectrum, Semiconductor Engineering, EE Times, Electronics Weekly, Chip Design, SemiWiki, Electronics For You, Nature Electronics, Science Daily (×2), Phys.org (×2), India Semiconductor Mission, IESA, AnandTech, The Register

### Tier 3 — RSS Feeds (Opportunities)

Academic Positions, Scholarship Roof, Jobs.ac.uk

### Tier 3 — HTML Scraping

ISRO Careers, DRDO Vacancies, CSIR Recruitment, CSIR RSS feed

---

## 4. The `scrape_sources` Config Table

All scraped sources are managed through the `scrape_sources` database table, which acts as the single source of truth for what to scrape, when, and how.

### Schema

```sql
create table public.scrape_sources (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  url             text not null,
  source_type     text not null check (source_type in ('rss', 'html', 'api')),
  tier            integer not null check (tier in (1, 2, 3)),
  category        text not null check (category in ('news', 'opportunity')),
  is_active       boolean not null default true,
  scrape_interval interval not null default '6 hours'::interval,
  last_scraped_at timestamptz,
  error_count     integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
```

### How It Enables No-Code Changes

Adding a new source does not require a deployment or code change. An admin simply inserts a row into `scrape_sources`:

```sql
insert into scrape_sources (name, url, source_type, tier, category, scrape_interval)
values ('Applied Materials Careers', 'https://careers.appliedmaterials.com/api/jobs', 'api', 1, 'opportunity', '4 hours'::interval);
```

The scraper engine reads all active sources, dispatches the appropriate handler (RSS parser, HTML scraper, or API client), and feeds results into the deduplication and verification pipeline.

---

## 5. Relevance Filtering

Every scraped item passes through a relevance gate before entering the database.

### Keyword Inclusion (380+ Keywords)

The system maintains a keyword list covering the semiconductor and electronics domain:

- **Job roles:** "VLSI engineer", "fabrication engineer", "semiconductor process engineer", "chip designer", "RF engineer"
- **Technologies:** "CMOS", "FinFET", "GaN", "SiC", "ASIC", "FPGA", "MEMS", "SoC"
- **Materials:** "silicon", "gallium nitride", "silicon carbide", "germanium"
- **Domains:** "analog design", "digital design", "verification", "DFT", "physical design", "packaging", "embedded systems"

If an item (title + description) contains at least one keyword, it passes inclusion.

### Blocklist Exclusion (45 Regex Patterns)

Items matching any blocklisted pattern are discarded immediately:

- **AI/ML roles:** `.*machine learning engineer.*`, `.*data scientist.*`
- **General tech:** `.*full stack.*`, `.*devops.*`, `.*frontend.*`, `.*backend.*`
- **Biotech / pharma:** `.*biolog(y|ist).*`, `.*pharma(ceutical)?.*`
- **Gaming / consumer:** `.*game developer.*`, `.*consumer electronics.*`
- **Finance / management:** `.*financial analyst.*`, `.*MBA.*`, `.*business development.*`
- **Unrelated:** `.*weather.*`, `.*social media.*`, `.*space exploration.*`

### Auto-Tagging (20+ Tag Categories)

Matching items are automatically tagged with categories such as: `vlsi`, `semiconductor`, `embedded`, `government`, `research`, `fabrication`, `eda`, `ai_ml_general` (when an AI keyword matches a semiconductor-adjacent context), `analog`, `digital`, `rf`, `power`, `mems`, `photonics`, `packaging`, `test`, `verification`, `design`, `process`, `materials`.

---

## 6. Deduplication Logic

### Primary Constraint

The `source_url` column in the `opportunities` and `news_articles` tables has a `UNIQUE` constraint. This is the first line of defense against duplicates.

### Source Authority Precedence

When the same opportunity is found from multiple sources (e.g., posted on both the official Intel ATS and an aggregator):

1. The first insertion (any tier) creates the row.
2. Subsequent attempts with the same `source_url` are silently ignored (`ON CONFLICT DO NOTHING`).
3. If the same real-world opportunity has different `source_url` values per source, the system keeps all entries but marks the highest-tier source as `primary` in a join table.

### Manual Dedup

Admins can merge duplicate entries through the admin panel, marking one as canonical and redirecting the others.

---

## 7. Verification Pipeline

Tier-3 sources (and any source with `error_count > 0`) feed into a verification state machine.

### States

```
pending ──→ link_check ──→ verified
                              │
                         flagged ──→ admin_review
```

| State | Meaning |
|---|---|
| `pending` | Newly scraped; awaiting first link check |
| `link_check` | Automated HEAD/GET request to the source URL in progress |
| `verified` | Link is reachable; content appears valid |
| `flagged` | Link returned 4xx/5xx, content mismatch, or parsing error |
| `expired` | Opportunity deadline has passed or news is >30 days old |

### Periodic Re-Check

- Verified entries are re-checked every 7 days.
- Flagged entries are re-checked every 24 hours (in case the source recovers).

### Auto-Hide

If an entry is flagged 3 times consecutively, it is automatically hidden from user-facing views and moved to an `archived` status. An admin notification is created.

---

## 8. Admin Management

### Adding a Source

1. Navigate to **Admin → Scrape Sources**.
2. Click **Add Source**.
3. Fill in: name, URL, source type (RSS/HTML/API), tier (1/2/3), category (news/opportunity), scrape interval.
4. Status is `active` by default. The scraper will pick it up on the next cycle.

### Editing a Source

- Update any field. Changed URLs or intervals take effect on the next scrape cycle.
- Deactivating a source (`is_active = false`) halts scraping immediately. Existing entries remain in the database.

### Viewing Status

The admin panel shows for each source:

- **Last scraped at** — timestamp of most recent successful scrape
- **Error count** — consecutive failures since last success
- **Total entries** — count of active entries derived from this source

### Recommended Workflow

1. Add the source to `scrape_sources` (no code).
2. If the source type is `html`, ensure a parser exists in `/lib/scrapers/html/`.
3. If the source type is `api`, ensure an API client exists in `/lib/scrapers/api/`.
4. When testing, set `scrape_interval` to `5 minutes`.
5. Once stable, increase interval to `6 hours` or `daily`.
