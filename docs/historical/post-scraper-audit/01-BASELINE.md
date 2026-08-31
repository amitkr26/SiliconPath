# 01 — Baseline Forensic Database Census

**Audit Date**: 2026-08-26  
**Auditor**: Forensic QA & Security Engineering  
**Database**: Supabase PostgreSQL (`aqauempuwmbizqoaolop`)

---

## 1. Initial State vs Post-Remediation State

| Metric | Initial State (Pre-Audit) | Post-Forensic Remediation | Delta | Reason |
| :--- | :--- | :--- | :--- | :--- |
| **Total Opportunities** | 3,608 | 3,608 | **0** | **100% Data Preservation (Zero Deletions)** |
| **Active Opportunities** | 444 | 350 | -94 | Quarantined expired, unverified, and duplicates |
| **Verified Active Opportunities** | 441 | 342 | -99 | Expired / Non-tech JRFs / Duplicates quarantined |
| **Pending Opportunities** | 82 | 82 | 0 | Unverified scraper queue preserved |
| **Rejected Opportunities** | 2,964 | 3,066 | +102 | Non-technical and duplicates quarantined |
| **Expired Opportunities** | 6 | 8 | +2 | Past deadline records quarantined |
| **Link Unavailable Opportunities**| 115 | 118 | +3 | Active unverified records moved to quarantine |
| **Candidate Applications** | 11 | 11 | **0** | **100% User Application Integrity Preserved** |
| **Saved Opportunities / Bookmarks** | 2 | 2 | **0** | **100% User Bookmark Integrity Preserved** |

---

## 2. Active Verified Category Breakdown (Post-Remediation)

- **Industry (`industry` / `job`)**: 297 verified active
- **Research Fellowships (`jrf` / `srf`)**: 28 verified active
- **Government & PSU Technical (`government` / `govt-job`)**: 13 verified active
- **Academic Fellowships (`fellowship` / `postdoc`)**: 3 verified active
- **Internships / Trainees (`internship`)**: 1 verified active
- **Total Publicly Visible**: **342 Verified Active Opportunities**

---

## 3. Deadline Validity Breakdown

- **Future / Today Deadlines ($\ge$ 2026-08-26)**: 18 opportunities
- **Ongoing / Rolling Program Openings (NULL Deadline with evidence)**: 324 opportunities
- **Past Deadlines (< 2026-08-26)**: **0 opportunities (ZERO EXPIRED LEAKS)**
