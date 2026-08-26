# 07 — Public API, Search & Sitemap Leak Invariant Audit

**Audit Date**: 2026-08-26  
**Audited Routes**:
- `GET /opportunities`
- `GET /api/opportunities`
- `GET /api/search`
- `GET /sitemap.xml`
- `GET /opportunities/[slug]`
- `GET /api/opportunities/stats`

---

## 1. Zero-Leak Invariant Verification

| Endpoint | Invariant Tested | Quarantined Records Returned | Result |
| :--- | :--- | :--- | :--- |
| `/api/opportunities` | Returns only `is_active=true AND verification_status='verified'` | **0** | **PASS** |
| `/api/search?q=...` | Returns only verified active listings | **0** | **PASS** |
| `/sitemap.xml` | Includes only active non-expired opportunities | **0** | **PASS** |
| `/api/opportunities/stats` | Counts only active verified listings in `byCategory` | **0** | **PASS** |
| `/opportunities/[slug]` | Renders 404/redirect for rejected or expired opportunities | **0** | **PASS** |

---

## 2. Pagination & Search Verification

- Default limit 20, max 100 enforced.
- Pagination returns correct `total_pages`, `total_count`, and `page` metadata.
- Searching for specialized terms (`VLSI`, `RTL`, `UVM`, `FPGA`, `STA`, `RISC-V`, `DRDO`, `ISRO`) returns accurate matches.
