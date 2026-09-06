# PHASE 2.6 — RELEVANCE HARDENING REPORT

**Date:** 2026-09-06
**Commit:** `93e08c1` (pushed to main)
**Preceded by:** Phase 2.5 (`4754b3e`)

---

## 1. Root Cause of Remaining Risk

The Phase 2.5 homepage used a two-pass strategy:

- **Pass 1:** verified + active + electronics/research tags
- **Pass 2:** if < 6, fill with **all verified + active** opportunities

This created a relevance bypass. A future irrelevant but verified+active opportunity could re-enter the homepage through Pass 2. The "all verified + active" fallback was the unsafe element — it treated verification as a proxy for relevance, which it is not.

Additionally, the Phase 2.5 relevance classifier had critical false positive bugs:
- `"sta"` matched `"staff"` (substring)
- `"soc"` matched `"social"` (substring)
- `"verification"` matched `"background verification"` (non-electronics context)
- Default fallback was `"possibly_relevant"` (include all unknowns)

---

## 2. Relevance Policy

| Level | Definition | Where Used |
|---|---|---|
| **relevant** | Clearly electronics/semiconductor/VLSI/research | Homepage featured, public search, all surfaces |
| **possibly_relevant** | From a relevant org but title is ambiguous | Public search/browse ONLY. NOT homepage. |
| **irrelevant** | Clearly not electronics/research | Excluded from all public surfaces |

**Homepage contract:** `VERIFIED + ACTIVE + RELEVANT` (high precision)
**Search contract:** `VERIFIED + ACTIVE + (RELEVANT | POSSIBLY_RELEVANT)` (high recall)
**Admin:** Everything (review/audit)

**Core rule:** ROLE SIGNAL beats ORG SIGNAL when they conflict.
- "Manager at BEL" → irrelevant (non-technical role wins over electronics org)
- "VLSI Engineer at Unknown" → relevant (electronics role wins over unknown org)

---

## 3. Homepage Query (Final)

```typescript
// page.tsx — single-pass relevance-only approach
const { data: candidateOpps } = await supabaseAdmin
  .from("opportunities")
  .select("*, organizations(*)")
  .eq("is_active", true)
  .eq("verification_status", "verified")
  .not("verification_status", "eq", "rejected")
  .not("verification_status", "eq", "pending")
  .not("verification_status", "eq", "link_unavailable")
  .not("verification_status", "eq", "expired")
  .or(buildAvailabilityDbFilter(computeIstToday()))
  .order("created_at", { ascending: false })
  .limit(200);

const homepageOpps = candidateOpps
  .filter(opp => isCurrentlyAvailable(opp))
  .filter(opp => classifyRoleRelevance(opp.title, opp.description, org, tags) === "relevant")
  .slice(0, 6);
```

**No fallback to irrelevant opportunities.** If fewer than 6 relevant exist, show fewer.

---

## 4. Classifier Changes (relevance.ts)

### Fixed False Positives

| Keyword | Before | After | Reason |
|---|---|---|---|
| `"sta"` | `"sta"` | `"static timing"` | Matched `"staff"`, `"station"`, `"standard"` |
| `"soc"` | `"soc"` | `" system on chip"` | Matched `"social"`, `"society"` |
| `"verification"` | `"verification"` | `"design verification"` | Matched `"background verification"`, `"police verification"` |
| `"arm"` | `"arm"` | removed | Matched `"farm"`, `"alarm"`, `"disarm"` |
| `"board"` | `"board"` | `"circuit board"`, `"board design"`, `"board test"` | Matched `"board of directors"` |

### Added IRRELEVANT_KEYWORDS

New entries: `"manager"` (generic), `"deputy manager"`, `"office manager"`, `"branch manager"`, `"teacher"`, `"tutor"`, `"educator"`, `"legal"`, `"lawyer"`, `"advocate"`, `"medical officer"`, `"medical staff"`, `"nursing"`, `"marketing"`, `"sales executive"`, `"business development"`

### Moved BARC

From `ELECTRONICS_PSUS` to `MIXED_PSUS` — BARC has electronics instrumentation but also major chemistry/biology/physics divisions. A "Chemistry Scientist at BARC" should not auto-qualify.

### Changed Default Fallback

Line 251: `"possibly_relevant"` → `"irrelevant"` (fail closed). Unknowns are excluded, not included.

### Removed Apprentice/Trainee from TECHNICAL_SIGNALS

Generic `"apprentice"` and `"trainee"` removed from the broader technical signals list. Multi-trade apprenticeships without electronics keywords no longer auto-qualify. Electronics-specific apprenticeships are caught by `hasElectronicsKeywords()` in steps 2-3.

---

## 5. Apprenticeship Handling

| Scenario | Classification | Homepage |
|---|---|---|
| "Electronics Trade Apprentice at BEL" | relevant (has "electronics") | eligible |
| "Trade Apprentice Recruitment 2026" at NTPC | irrelevant (no electronics keywords, NTPC not in PSU sets) | excluded |
| "Fitter Welder Carpenter Apprentice" | irrelevant (has IRRELEVANT_KEYWORDS) | excluded |
| "JRF at CSIR" | relevant (has research keywords) | eligible |
| "Apprentice at ISRO" (no trade specified) | irrelevant (ISRO is MIXED_PSU, "apprentice" not in TECHNICAL_SIGNALS) | excluded |
| "Electronics Apprentice at ISRO" | relevant (has "electronics") | eligible |

**Principle:** A multi-trade advertisement is only included when the electronics/electrical portion can be established from the title.

---

## 6. Database

**No records changed in Phase 2.6.**

Phase 2.5 deactivations verified:
- 8 deactivated records: all confirmed `is_active=false` ✓
- 5 retained government records: all confirmed `is_active=true` ✓
- 0 destructive deletions (all changes reversible)

---

## 7. Regression Tests

**21/21 PASS** including the unsafe fallback scenario.

| Test | Description | Result |
|---|---|---|
| A | Relevant electronics job → homepage eligible | PASS |
| B | VLSI job → homepage eligible | PASS |
| C | Embedded job → homepage eligible | PASS |
| D | JRF → homepage eligible | PASS |
| E | Mechanical PSU job → homepage excluded | PASS |
| F | Civil government job → homepage excluded | PASS |
| G | HR at electronics company → homepage excluded | PASS |
| H | Generic government recruitment → homepage excluded | PASS |
| I | Multi-trade apprenticeship → homepage excluded | PASS |
| J | Electronics apprenticeship → homepage eligible | PASS |
| K | Verified irrelevant record → homepage excluded | PASS |
| L | Pending relevant record → relevance passes, availability excludes | PASS |
| M | Active relevant record → homepage eligible | PASS |
| O | Manager at BEL → excluded (role wins over org) | PASS |
| P | Accountant at ISRO → excluded (negative wins) | PASS |
| Q | Software Dev at Qualcomm → relevant | PASS |
| R | Chemistry Scientist at BARC → excluded (BARC is mixed PSU) | PASS |
| S | Electronics Scientist at BARC → relevant | PASS |
| T | Teacher at BEL → excluded | PASS |
| U | Completely unknown opportunity → excluded (fail closed) | PASS |
| **V** | **UNSAFE FALLBACK: 2 relevant + 10 irrelevant → only 2** | **PASS** |

---

## 8. Playwright

| Viewport | Status | File |
|---|---|---|
| Mobile (390×844) | ✓ Loads correctly | `playwright-mobile-phase26.png` |
| Desktop (1440×900) | ✓ Loads correctly | `playwright-desktop-phase26.png` |
| Full page (desktop) | ✓ All sections render | `playwright-fullpage-phase26.png` |

**Visual verification:**
- Hero: "India's Career & Research Gateway for Semiconductor & VLSI Engineering"
- Filter chips: ISRO, DRDO, CSIR, IIT, Qualcomm, Intel, SystemVerilog
- Opportunity cards: 6 verified Western Digital listings (electronics-relevant)
- No generic sarkari naukri filler
- Trust section present: "Transparency Over Testimonials"
- All 13 sections render correctly
- No horizontal overflow, no broken layouts

---

## 9. Phase 1 Regression

**PASS** — All Phase 1 fixes intact:
- Pending exclusion filter (availability.ts) ✓
- Homepage trust copy (PublicHome.tsx) ✓
- CAT_MAP (run-opportunity-scrape.ts) ✓
- Nav links (Navbar.tsx) ✓
- Stats fallback (page.tsx) ✓

---

## 10. Phase 2 Regression

**PASS** — All Phase 2 UI fixes intact:
- Mobile-first typography ✓
- Skip-to-content link ✓
- FAQ aria-expanded/keyboard navigation ✓
- NewsCard Escape/backdrop close ✓
- Ask AI safe-area-inset ✓
- focus-visible ring ✓

---

## 11. Orphaned Scraper Assessment

| Scraper | Status | Evidence |
|---|---|---|
| `sarkari-scraper.ts` | **ACTIVE** | Imported by 3 API routes: `/api/scrapers/[slug]`, `/api/scrapers/sarkari`, `/api/scrapers/railways` |
| `govt-scraper.ts` | **ORPHANED** | Zero imports anywhere in the codebase. Dead legacy code. Safe for later cleanup. |

**Recommendation:** Do not remove `govt-scraper.ts` in this phase. Document as deprecated. Remove in a future cleanup pass.

---

## 12. Remaining Risks

1. **Classification is title-based:** If a scraper produces a generic title like "Engineer" without electronics keywords, the opportunity won't qualify for the homepage even if the role is electronics-related. Mitigation: scrapers should produce descriptive titles.

2. **Possibly_relevant in search:** Software roles at semiconductor companies (e.g. "Cloud Engineer at Graphcore") are classified as `"possibly_relevant"` and appear in search but not the homepage. This is intentional — high precision on homepage, high recall in search.

3. **ISTRAC apprentice trainee:** One ISRO apprenticeship includes ITI trade-level positions alongside degree-level. It's classified as `"possibly_relevant"` (appears in search, not homepage). Acceptable.

4. **No automated verification:** Link check cron does NOT auto-verify. Verification remains manual admin action only.

---

**Status:** COMPLETE — all Phase 2.6 objectives met, committed (`93e08c1`), pushed, production verified.
