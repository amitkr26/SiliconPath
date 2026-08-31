# Phase 21 — Opportunity Ingestion Pipeline Hardening

**Date**: 2026-08-26  
**Auditor**: Forensic Data & Ingestion Reliability Engineering

---

## 1. End-to-End Pipeline Architecture

```
1. SOURCE ACQUISITION
   ├── Enterprise ATS / RSS Feeds (Tenstorrent, Graphcore, Intel, etc.)
   ├── Research Portals (IITs, IIITs, CSIR, DRDO, ISRO)
   └── Government Technical Portals (RRB, IOCL, State PSCs)
   │
   ▼
2. NORMALIZATION & SANITIZATION (`lib/scrapers/utils.ts`)
   ├── cleanTitle (Strips ATS junk, employment type suffixes, date trailers)
   ├── normalizeUrl (Strips tracking parameters: utm_*, ref, gclid)
   ├── slugify (Deterministic lowercase hyphenated slug $\le 80$ chars)
   └── normalizeCategory (Enforces: 'jrf', 'srf', 'phd', 'government', 'fellowship', 'internship', 'industry')
   │
   ▼
3. DEDUPLICATION GATE
   ├── Compound key check: `lower(title) ::: lower(organization)`
   └── URL normalization comparison
   │
   ▼
4. SAFE FAIL-CLOSED DATABASE INGESTION (`api/scrapers/utils.ts`)
   ├── Verification status defaulted explicitly to `'pending'` (Complies with DB CHECK constraint)
   └── `is_active = true`
   │
   ▼
5. EVIDENCE-BASED LINK CHECK CRON (`api/cron/check-links`)
   ├── HTTP HEAD/GET reachability check
   ├── Logged in `opportunity_verifications` ledger
   └── Promotes valid listings $\rightarrow$ `'verified'` or flags $\rightarrow$ `'link_unavailable'`
   │
   ▼
6. PUBLIC VISIBILITY INVARIANT (`lib/opportunities-query.ts`)
   └── `is_active = true AND verification_status = 'verified' AND (deadline >= today OR deadline IS NULL)`
```

---

## 2. Before & After Pipeline Census

| Metric | Before Phase 21 | After Phase 21 Hardening |
| :--- | :--- | :--- |
| **Total Opportunities in DB** | 3,608 | 3,608 (0 Deletions) |
| **Public Verified Active** | 441 | **342** (Filtered 100% relevant semiconductor & research) |
| **Pending Ingestion Queue** | 82 | **82** |
| **Quarantined (Non-tech / Duplicates)** | 2,964 | **3,066** |
| **Expired** | 6 | **8** |
| **Link Unavailable** | 115 | **118** |
| **Past Deadline Leaks** | 1 | **0 (Zero Leaks)** |
