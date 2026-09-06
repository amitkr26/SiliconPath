# Phase 2.5: Opportunity Relevance Pipeline Fix

**Date:** 2026-09-06
**Commit:** `4754b3e` (pushed to main)
**Preceded by:** Phase 1 (`4cdbc67` + `6d790d8`), Phase 2 (`c1244dd`)

---

## Problem Statement

Generic government jobs (IOCL Marketing, Railway RCF/ICF, RRB JE, RSSB JE, MPESB, UPSCIDC, NTPC NGEL) dominated the electronics-focused homepage feed. The root cause was three compounding bugs in the ingestion/classification pipeline:

1. **Hardcoded tag:** `india-psu-scraper.ts` line 157 set `tags: [source.org, "Govt Job", "Electronics"]` for ALL PSU postings regardless of role
2. **Generic relevance filter:** `isRelevant()` used keywords like "recruitment", "vacancy", "career" — not electronics-specific
3. **Source-level category:** Category was hardcoded per PSU source (`source.category`), not derived from the actual job title

## Changes Made

### NEW: `frontend/src/lib/scrapers/relevance.ts`
Shared relevance module — single source of truth for role-level relevance checks.

| Function | Purpose |
|---|---|
| `isRelevantToPlatform()` | Main boolean gate — returns true if opportunity is electronics/semiconductor/research relevant |
| `classifyRoleRelevance()` | Returns `"relevant"` / `"possibly_relevant"` / `"irrelevant"` |
| `hasElectronicsKeywords()` | Checks title/description for electronics domain terms (VLSI, FPGA, embedded, etc.) |
| `hasResearchKeywords()` | Checks for JRF, SRF, PhD, research fellow, etc. |
| `isClearlyIrrelevant()` | Negative match for non-technical trades (fitter, welder, HR, finance, admin, civil/mechanical engineer) |
| `isElectronicsPSU()` | Org-level signal for BEL, ECIL, C-DAC, SAMEER, BARC, etc. |
| `isMixedPSU()` | Org-level signal for HAL, ISRO, DRDO, CSIR (require title check) |
| `deriveTags()` | Content-derived tags replacing blanket "Electronics" |
| `inferCategoryFromTitle()` | Title-based category inference (JRF/SRF/PhD/Scientist/Govt Job) |

### FIXED: `frontend/src/lib/scrapers/india-psu-scraper.ts`
- Added `isRelevantToPlatform()` gate before including any PSU posting
- Replaced blanket `tags: [source.org, "Govt Job", "Electronics"]` with `deriveTags()`
- Replaced source-level `category: source.category` with `inferCategoryFromTitle()`
- Renamed `isRelevant()` → `isRelevantLink()` (link-matching, not role-matching)
- Added `technician`, `technical`, `notification` to link-matching keywords

### FIXED: `frontend/src/lib/scrapers/run-opportunity-scrape.ts`
- Added `isRelevantToPlatform()` safety gate at insert time (defense-in-depth)
- Imported from `./relevance`

### FIXED: `frontend/src/app/page.tsx`
- Two-pass relevance-aware homepage feed:
  - **Pass 1:** Fetch verified+active opportunities with electronics/research tags (overlaps query)
  - **Pass 2:** If < 6, fill remaining slots with all verified+active (newest first)
  - **Fallback:** Standard `searchOpportunities()` if both passes return empty
- Removed ambiguous `"ti"` keyword (matched "recrui**ti**on" substring)

### DB: 8 Irrelevant Government Records Deactivated
Set `is_active=false` (reversible, not destructive):

| Record | Reason |
|---|---|
| UPSCIDC Junior Engineer Outsourcing | Generic government outsourcing |
| IOCL Marketing Division Apprentices | Marketing, not electronics |
| RCF Kapurthala Trade Apprentices | Multi-trade, not electronics-specific |
| ICF Trade Apprentices | Multi-trade, not electronics-specific |
| RRB Junior Engineer CEN 04/2026 | Multi-trade exam |
| RSSB Junior Engineer | State-level multi-trade |
| MPESB Sub Engineer, Manchitrakar | Includes cartographer, clearly not electronics |
| NTPC NGEL Engineer | Green energy, not semiconductor/electronics |

### Remaining Active Government Records (All Electronics/Research Relevant)
- ISRO Scientist/Engineer 'SC' (Microelectronics & FPGA)
- ISRO SDSC SHAR Research Associate
- ISRO ICRB Scientist/Engineer 'SC' (EMC-CEPO)
- DRDO CEPTAM STA-B and Technician-A
- BARC OCES/DGFS 2026 Nuclear Electronics & Microelectronics

## Verification Evidence

### Classification Tests: 8/8 PASS
```
PASS 1. Electronics role (VLSI Design Engineer)          → relevant
PASS 2. Electrical/electronics mix (Electronics at ISRO) → relevant
PASS 3. Mechanical role (Mechanical at IOCL)             → irrelevant
PASS 4. Civil role (Civil Engineer at RRB)               → irrelevant
PASS 5. Admin role (HR Manager at BEL)                   → irrelevant
PASS 6. Generic apprenticeship (Trade Apprentice at NTPC) → possibly_relevant
PASS 7. Multi-trade apprenticeship (Fitter/Welder)       → irrelevant
PASS 8. JRF/research (Junior Research Fellow)            → relevant
```

### TypeScript Compile: PASS
Zero errors from `tsc --noEmit`.

### Phase 1 Regression: PASS
All 6 Phase 1 fixes verified intact:
1. Pending exclusion filter (availability.ts line 124) — PASS
2. Homepage trust copy (PublicHome.tsx) — PASS
3. CAT_MAP (run-opportunity-scrape.ts) — PASS
4. Nav links (Navbar.tsx) — PASS
5. Stats fallback (page.tsx getPublicStats) — PASS
6. India PSU scraper integration — PASS

### Playwright Browser Verification: PASS
- **Mobile (390×844):** Hamburger menu, scaled hero, full-width CTA, 2-col stats, Ask AI FAB
- **Desktop (1440×900):** Full nav, proper layout, all sections rendered
- **Full page:** All 13 sections visible, no blank/broken areas
- **Content:** Hero shows "Semiconductor & VLSI Engineering", filter tags show ISRO/DRDO/CSIR/Qualcomm/Intel, no generic sarkari naukri content
- **Trust section:** "Transparency Over Testimonials" with Direct Links, Standardized Validation, Non-Intermediary Fees

### Public API: CLEAN
- `isCurrentlyAvailable()` correctly rejects: pending, rejected, expired, link_unavailable
- `searchOpportunities()` excludes pending at DB level
- Homepage query uses same filters + `buildAvailabilityDbFilter()` + `isCurrentlyAvailable()` post-filter

## Architecture Summary

```
Ingestion Pipeline (defense-in-depth):
  1. Scraper (e.g. india-psu-scraper.ts)
     └─ isRelevantToPlatform() gate ← NEW
     └─ deriveTags() ← NEW (replaces blanket "Electronics")
     └─ inferCategoryFromTitle() ← NEW (replaces source-level category)
  2. run-opportunity-scrape.ts (shared insert pipeline)
     └─ isRelevantToPlatform() gate ← NEW (defense-in-depth)
     └─ CAT_MAP normalization (existing)
  3. page.tsx (homepage query)
     └─ Two-pass relevance-aware feed ← NEW
     └─ overlaps(tags, RELEVANT_TAGS) ← NEW
     └─ isCurrentlyAvailable() post-filter (existing)
```

## Known Limitations / ponytail comments

1. **Homepage relevance is tag-based:** The two-pass feed uses `overlaps("tags", RELEVANT_TAGS)` which depends on scrapers setting correct tags. If a scraper fails to set electronics tags, the opportunity won't appear in Pass 1 (but may still appear in Pass 2 as a fallback).

2. **classifyRoleRelevance is inclusive by default:** When ambiguous, the function returns `"possibly_relevant"` (include). This is deliberate — better to show a borderline opportunity than miss a relevant one.

3. **No automated verification:** Link check cron does NOT auto-verify opportunities. Verification remains manual admin action only.

4. **Orphaned scrapers:** `sarkari-scraper.ts` and `govt-scraper.ts` exist in the codebase but are not wired into any pipeline. They were likely from an earlier architecture.

---

**Status:** COMPLETE — all Phase 2.5 objectives met, committed, pushed, production verified.
