# 05 — Duplicate & Canonicalization Forensic Audit

**Audit Date**: 2026-08-26  
**De-duplication Strategy**: Compound Normalized Matching (`title_norm + org_norm`) + Exact Application URL Matching

---

## 1. De-Duplication Results

During the forensic audit, **84 duplicate active opportunities** were identified and quarantined:
- **Canonical 1st Record**: Kept active (`is_active = true`, `verification_status = 'verified'`).
- **Subsequent Identical Copies**: Moved to quarantine (`is_active = false`, `verification_status = 'rejected'`).

### Examples of De-duplicated Opportunity Clusters:
1. **Tenstorrent Maintenance Engineer Interns**:
   - Primary Retained: `0dcef6f8-fa36-4eef-be7b-83b3f7a797d5`
   - Quarantined Duplicates: `beefeb9f-ba91-407e-b607-07be5fc38d30`, `7df688b7-3c2e-4e1f-ad0c-ab94c687e8e8`, `431a420f-c4c2-4e37-9378-f9242fb1a5a2`, `bd0c396f-3808-409d-ab22-1a06bf43ff56`, `00150e75-e897-4576-8164-b6ed3aae1b9b`.
2. **Graphcore Kubernetes Infrastructure Engineers**:
   - Primary Retained: `1190d927-e26b-497d-87a3-8138d2df6900`
   - Quarantined Duplicates: `a88117ef-9e0e-4ea7-a2b2-32b6f3b02ba1`, `bcce462c-62e1-46f2-8e32-76b964dcbf45`, `6a5274dc-27bd-4311-a138-8f64addc87e3`.
3. **Graphcore ML QA Software Engineers**:
   - Primary Retained: `239b383b-6626-4c2d-b0f4-82b53ab37600`
   - Quarantined Duplicates: `747cc9cb-3ae1-4768-8df2-ff5f83852e80`, `6c3fa907-add5-45d3-9479-69c700ab98b2`.
4. **ISRO ISTRAC Graduate & Trade Apprentices**:
   - Primary Retained: `9b4543a8-1e5b-4be0-9b21-cfd8671c9ea1`
   - Quarantined Duplicate: `b11b8d9f-5fe6-4a89-874a-cfacb03442b7`.

---

## 2. Foreign Key & User Bookmark Safety

Before de-duplication, all referenced IDs in `applications` and `saved_opportunities` were cross-checked:
- Referenced IDs: `51c169be-...`, `6d6804c2-...`, `ce0df266-...`, `e1a6d4c7-...`, `0aa38d2d-...`.
- **Zero foreign key violations**: Zero opportunities with user bookmarks or applications were modified or broken.
