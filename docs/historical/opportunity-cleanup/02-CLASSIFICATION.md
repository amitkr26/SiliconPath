# 02 — OPPORTUNITY CLASSIFICATION MATRIX
Generated: 2026-08-23T15:18:14.712Z

| Classification Code | Group Name | Count | Lifecycle Action |
| :--- | :--- | :--- | :--- |
| **A** | **KEEP — Verified + Current + Relevant** | 346 | `is_active = true`, `verification_status = 'verified'` (Public Active) |
| **B** | **KEEP — Verified Open-Ended Industry** | 0 | `is_active = true`, `verification_status = 'verified'` (Public Active) |
| **C** | **EXPIRED — Deadline Elapsed** | 6 | `is_active = false`, `verification_status = 'expired'` (Archived) |
| **D** | **CLOSED / UNAVAILABLE** | 99 | `is_active = false`, `verification_status = 'link_unavailable'` (Quarantined) |
| **E** | **UNVERIFIED — Pending Scraper Queue** | 80 | `is_active = false`, `verification_status = 'pending'` (Admin Queue) |
| **F** | **FAKE / SUSPICIOUS / PLACEHOLDER** | 13 | `is_active = false`, `verification_status = 'rejected'` (Quarantined) |
| **G** | **IRRELEVANT NON-TECH** | 57 | `is_active = false`, `verification_status = 'rejected'` (Quarantined) |
| **H** | **DUPLICATE RECORD** | 2989 | `is_active = false`, `verification_status = 'rejected'` (Deduplicated) |
| **I** | **INVALID / CORRUPTED DATA** | 5 | `is_active = false`, `verification_status = 'rejected'` (Quarantined) |
| **J** | **STALE / UNKNOWN** | 0 | `is_active = false`, `verification_status = 'expired'` (Archived) |
| **K** | **MANUAL REVIEW REQUIRED** | 0 | `is_active = false`, `verification_status = 'pending'` (Review Stream) |

**Total Records Classified**: 3595 (100.0% coverage)
