# Phase 30C: Opportunity Data Intelligence & Verification Audit

**Platform**: BerojgarDegreeWala  
**Audit Date**: August 28, 2026  
**Auditor**: Antigravity Quality & Verification Specialist  
**Status**: **PIPELINE SPECIFIED & TESTED**

---

## 1. Database Reality & Inventory

The live opportunities repository holds **3,609 records**:
- **343 Active Opportunities**: Reachable and currently available for application.
- **316 Verified Opportunities**: Verified against official recognized hosts (`isro.gov.in`, `drdo.gov.in`, `iitb.ac.in`, etc.).
- **82 Pending Review**: Awaiting manual or automated quality evaluation.
- **142 Link Unavailable**: External application links flagged as unreachable or broken.
- **3,061 Archived / Historical**: Preserved historical listings retained for career market analytics and past research reference.

---

## 2. Deterministic 0–100 Quality Scoring Model

The quality scoring algorithm implemented in [`frontend/src/lib/opportunity-quality.ts`](file:///d:/Tinkerscape/SiliconPath/frontend/src/lib/opportunity-quality.ts) calculates an explainable score based on deterministic criteria:

```
Total Quality Score (0–100) =
  + Source Trustworthiness (0–20)
  + Official Source Link (0–15)
  + Application Link Validity (0–15)
  + Deadline Validity (0–10)
  + Organization Verification (0–10)
  + Title Quality (0–10)
  + Description Completeness (0–10)
  - Duplicate Penalty (-20)
  - Broken Link Penalty (-30)
  - Expired Deadline Penalty (-15)
```

### Breakdown Categories:
1. **Source Trust (0–20)**:
   - Official Semiconductor / Research MNCs / Govt / IITs (`.gov.in`, `.res.in`, `.ac.in`, Intel, TI, Qualcomm, etc.) -> **20 pts**
   - General academic or edu hosts -> **18 pts**
   - Standard scraped web sources -> **12 pts**
2. **Official Source Link (0–15)**: Valid HTTPS URL present -> **15 pts**
3. **Application Link (0–15)**: Dedicated reachable application URL -> **15 pts**
4. **Deadline Validity (0–10)**: Future deadline confirmed -> **10 pts**; rolling/unspecified -> **5 pts**; expired -> **0 pts** (-15 penalty).
5. **Organization Verification (0–10)**: Linked to verified organization row -> **10 pts**
6. **Title Quality (0–10)**: Clean, professional title (10–120 chars, no spam) -> **10 pts**
7. **Description Completeness (0–10)**: Substantial eligibility & role details (>100 chars) -> **10 pts**

---

## 3. Status Model Separation

Phase 30C strictly decouples `verification_status` from `lifecycle_status`:

| Field | Possible Values | Meaning |
| :--- | :--- | :--- |
| **`verification_status`** | `verified`, `pending`, `unverified`, `rejected` | Authenticity and legitimacy of the job listing. |
| **`lifecycle_status`** | `active`, `expired`, `archived`, `broken_link`, `draft` | Temporal availability and application link state. |

Public opportunity feeds (`/opportunities`, `/api/opportunities`) exclusively surface listings where:
- `lifecycle_status = 'active'`
- `verification_status != 'rejected'`
- Deadline is valid or rolling in Indian Standard Time (IST).
