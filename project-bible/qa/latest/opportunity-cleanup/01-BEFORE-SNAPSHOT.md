# 01 — BEFORE CLEANUP DATABASE SNAPSHOT
Generated: 2026-08-23T15:18:14.709Z (IST: 2026-08-23)
Project: `aqauempuwmbizqoaolop` (Supabase Production Database)

## 1. High-Level Metrics Baseline
| Metric | Count | Description |
| :--- | :--- | :--- |
| **TOTAL OPPORTUNITIES** | **3595** | Total records currently in the `opportunities` table |
| **IS_ACTIVE = TRUE** | **3571** | Marked as active in DB |
| **IS_ACTIVE = FALSE** | **24** | Marked as inactive in DB |
| **VERIFIED STATUS** | **3240** | `verification_status = 'verified'` |
| **PENDING STATUS** | **158** | `verification_status = 'pending'` |
| **REJECTED STATUS** | **1** | `verification_status = 'rejected'` |
| **EXPIRED STATUS** | **12** | `verification_status = 'expired'` |
| **LINK_UNAVAILABLE** | **184** | `verification_status = 'link_unavailable'` |
| **EXPIRED BY DEADLINE** | **11** | `deadline < 2026-08-23` |
| **FUTURE / TODAY DEADLINE** | **47** | `deadline >= 2026-08-23` |
| **MISSING DEADLINE (NULL)** | **3537** | Open-ended or ongoing regular listings |
| **INVALID DEADLINE FORMAT** | **0** | Corrupted date format |
| **DUPLICATES FOUND** | **3047** | Exact URL or Title+Org collisions |
| **MISSING APPLY URL** | **3** | Null, empty, or dummy '#' URL |
| **IRRELEVANT ROLES** | **57** | Sales, non-tech, hospital, real estate |
| **POTENTIALLY FAKE/TEST** | **13** | Placeholder domains or test jobs |

## 2. Foreign Key & User Activity Protection
- **Candidate Applications in DB**: 11 applications across 9 opportunities.
- **Saved Opportunities / Bookmarks**: 2 saved across 2 opportunities.
- **Data Protection Guarantee**: No opportunity with candidate applications or bookmarks will be hard-deleted from the database. Non-active or invalid records will be archived/quarantined via `is_active = false` and `verification_status = 'expired' | 'rejected'`.
