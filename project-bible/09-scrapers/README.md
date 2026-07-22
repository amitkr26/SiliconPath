# Scraper Architecture

> [!IMPORTANT]
> **Consolidation Note (July 2026)**: The scraping engine is now fully consolidated inside the `berojgardegreewala` Next.js application. All ATS adapters, custom HTML adapters (including ISRO, DRDO, CSIR), and RSS adapters are imported dynamically and executed via Serverless API endpoints on Vercel (triggered by Vercel Cron). The Render Express-based scraping tiers documented below are legacy references only.

## Overview

BerojgarDegreeWala operates a consolidated scraping system integrated within the Next.js app under `src/lib/scrapers/` to fetch opportunities across ATS/HTML/RSS sources.

## Architecture

```
Vercel Cron (/api/cron/*) → SCRAPER_SECRET → Render Backend (/scrape/*)
                                                    ↓
                                          Orchestrator (concurrency-limited)
                                                    ↓
                         ┌──────────┬──────────┬──────────┬──────────┐
                         ↓          ↓          ↓          ↓          ↓
                    Greenhouse  Workday    Lever    SmartR    Schema/RSS/HTML
                   Adapter    Adapter   Adapter  ecruiters   Adapters
                                              Adapter
```

## Source Registry

**332+ sources** across 17 batches in `backend/src/scrapers/source-config.ts`:

| Batch | Category | Count | Examples |
|-------|----------|-------|---------|
| 1 | Semiconductor IDM | 20+ | Intel, TSMC, Samsung, Micron |
| 2 | Fabless | 20+ | NVIDIA, AMD, Qualcomm, Broadcom |
| 3 | Equipment | 15+ | ASML, Applied Materials, Lam Research |
| 4 | Materials | 10+ | Dow, ShinEtsu, Sumco |
| 5 | OSAT | 10+ | ASE, Amkor, JCET |
| 6 | Power/Auto | 15+ | Infineon, NXP, STMicro, Renesas |
| 7 | Memory/Storage | 10+ | Samsung, SK Hynix, Western Digital |
| 8 | Test/Measurement | 10+ | Keysight, Teradyne, Advantest |
| 9 | EDA | 10+ | Synopsys, Cadence, Siemens EDA |
| 10 | Networking/Chip | 15+ | Marvell, MediaTek, Realtek |
| 11 | National Labs (India) | 15+ | DRDO, ISRO, BARC, CSIR |
| 12 | National Labs (Intl) | 20+ | IMEC, Fraunhofer, MIT Lincoln |
| 13 | Universities (India) | 30+ | IITs, NITs, IIITs, IISc |
| 14 | Universities (NA) | 30+ | Stanford, MIT, Berkeley, CMU |
| 15 | Universities (Europe) | 30+ | ETH, Cambridge, TU Delft, KU Leuven |
| 16 | News RSS | 20+ | Semiconductor industry news |
| 17 | Opportunity RSS | 20+ | Research/funding RSS feeds |

## Adapter Specification

Each adapter must implement:

```typescript
interface ScraperAdapter {
  name: string;
  type: 'ats' | 'html' | 'rss' | 'schema';
  scrape(source: SourceConfig): Promise<ScrapedResult[]>;
  validate?(item: ScrapedOpportunity): boolean;
}
```

### Supported Adapter Types
- **Greenhouse**: Board API via `boards-api.greenhouse.io`
- **Lever**: Postings API via `api.lever.co`
- **SmartRecruiters**: Postings API via `api.smartrecruiters.com`
- **Workday**: Workday API (POST to `/wday/cxs/{tenant}/{site}/jobs`) with HTML fallback
- **HTML**: Generic cheerio-based extraction with TLS fallback for `.gov.in`/`.ac.in`
- **RSS**: Feed parser with custom field extraction
- **Schema.org**: JSON-LD extraction from `<script type="application/ld+json">`

## Data Quality Pipeline

```
Raw scrape → Clean title (remove nav headings) → Normalize URL
  → Deduplicate (by source_url) → Infer category → Resolve organization
  → AI parse (for unstructured listings) → Filter garbage titles
  → Insert as verification_status='pending' → Admin review → 'verified'
```

### Garbage Title Filter
The `GARBAGE_TITLE_PATTERNS` regex in `src/lib/scrapers/utils.ts` blocks nav headings (Home, Contact, Sitemap, About, etc.). Titles shorter than 6 characters are also rejected.

### Category Inference
When a source does not specify category, the system infers from title keywords:
- JRF/SRF → research fellowships
- PhD/Postdoc/Research Associate → academic
- Internship → internship
- Engineer/Scientist → industry/government

## Scheduling

Vercel Cron triggers:
- `6:00 AM IST`: India sources (ISRO, DRDO, CSIR, PSUs, IITs)
- `8:00 AM IST`: Global sources (semiconductor companies, international unis)
- `9:00 AM IST`: Link health check
- `12:00 PM Sunday`: Weekly digest

Backend scheduler (`node-cron` in `backend/src/cron/scheduler.ts`):
- 6:00 AM: Daily full scrape
- 6:30-10:00 AM Mon-Fri: Staggered batches 1-17
- 2:00 AM: Archive old news
- Every 6 hours: Sync neon replica

## Related Documents

- [source-registry.md](./source-registry.md) — Full source configuration
- [adapter-spec.md](./adapter-spec.md) — Adapter interface details
- [pipelines.md](./pipelines.md) — Orchestration and execution
- [quality.md](./quality.md) — Data quality and dedup
