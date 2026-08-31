# 04 — Deadline Integrity & Timeline Validation

**Audit Date**: 2026-08-26  
**Reference Timestamp**: `2026-08-26T11:15:00+05:30` (Indian Standard Time)

---

## 1. Active Opportunities Timeline Distribution

| Deadline Classification | Count | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Past Deadline (< 2026-08-26)** | **0** | **CLEAN (0 LEAKS)** | 100% of expired records quarantined |
| **Today's Deadline (= 2026-08-26)** | 0 | N/A | No active records closing today |
| **Within 7 Days (2026-08-27 to 2026-09-02)** | 4 | **Active** | CSIR CEERI, MPESB Sub Eng, etc. |
| **Within 30 Days (2026-09-03 to 2026-09-25)** | 12 | **Active** | RRB JE, IOCL, RCF, ICF, BARC, NASA JPL |
| **Beyond 30 Days (> 2026-09-25)** | 2 | **Active** | ASML EUV, ISRO URSC JRF |
| **Ongoing / Rolling Openings (NULL)** | 324 | **Active** | Continuous enterprise hiring pipelines |

---

## 2. Quarantined Expired Records (Count: 2)

1. `86379a24-6847-4c2d-a748-68724ef652f7` — Rajasthan RVUNL (Expired `2026-08-25`) $\rightarrow$ `verification_status = 'expired'`, `is_active = false`.
2. `4f4f1e5b-2dc1-4e70-b5d6-a263933f68ff` — CSIR CMERI (Expired `2026-08-03`) $\rightarrow$ `verification_status = 'expired'`, `is_active = false`.

---

## 3. UI Countdown & Date Rendering Invariants

- **Zero `NaN` day countdowns**: `getDaysUntilDeadline()` strictly guards against null and malformed timestamps, defaulting to 999.
- **Zero 1970 Epoch artifacts**: `formatDate()` validates `isNaN(date.getTime())` before rendering formatted text.
- **Strict Indian Standard Time (`+05:30`) Calculation**: Both client `utils.ts` and server `availability.ts` compute day boundaries using IST offset.
