# 10 — CLEANUP EXECUTION & VERIFICATION REPORT
Execution Date: 2026-08-23T15:18:51.517Z (IST: 2026-08-23)
Database: `aqauempuwmbizqoaolop` (Production Supabase)

## 1. Before vs After Reconciliation
| State / Metric | Before Cleanup | After Cleanup | Net Difference | Lifecycle Treatment |
| :--- | :--- | :--- | :--- | :--- |
| **Total Opportunities** | 3,595 | **3,595** | 0 | 100% Data Preservation |
| **Active Public Postings** | 3,571 | **431** | -3140 | Only genuine, unique, active verified jobs shown |
| **Verified Active Postings** | 3,240 | **431** | -2809 | Clean verified semiconductor & research openings |
| **Expired Postings** | 12 | **6** | +-6 | Archived (deadline passed) |
| **Rejected / Quarantined** | 1 | **2963** | +2962 | Duplicates, non-tech irrelevant, placeholder fake |
| **Pending Moderation Queue** | 158 | **85** | -73 | Stored safely for admin review |
| **Link Unavailable** | 184 | **110** | -74 | Broken link quarantine |

## 2. Foreign Key & User Activity Verification
- **Candidate Applications**: 100% Preserved (11 applications intact).
- **Candidate Saved Bookmarks**: 100% Preserved (2 bookmarks intact).
- **Foreign Key Violations**: 0 violations. No rows hard-deleted.

## 3. Public Discovery Integrity
- All public feeds (`/opportunities`, `/`, `/search`) now strictly query `is_active = true` and `verification_status = 'verified'`.
- Stale duplicates (2,989 rows) and expired deadlines are completely excluded from candidate discovery.
