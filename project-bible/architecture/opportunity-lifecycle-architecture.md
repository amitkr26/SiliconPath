# Opportunity Lifecycle & Verification Architecture

**Platform**: BerojgarDegreeWala  
**Document Version**: 1.0 (Phase 30C Opportunity Data Pipeline)  

---

## 1. State Machine & Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> Scraped_Draft : Scraper Ingestion
    [*] --> Employer_Posted : Employer Submission

    Scraped_Draft --> Pending_Review : Deterministic Sanitization
    Employer_Posted --> Pending_Review : Content Safety Check

    Pending_Review --> Verified_Active : Quality Score >= 75 & Valid Links
    Pending_Review --> Unverified_Active : Quality Score 50–74
    Pending_Review --> Rejected : Spam / Incoherent / Broken Link

    Verified_Active --> Expiring_Soon : Deadline within 7 Days (IST)
    Unverified_Active --> Expiring_Soon : Deadline within 7 Days (IST)

    Expiring_Soon --> Expired : Deadline Elapsed
    Verified_Active --> Broken_Link : Automated Health Check 404/Timeout
    
    Expired --> Archived : Preserved for Career Analytics
    Broken_Link --> Archived : Unresolved for 14 Days
```

---

## 2. Ingestion & Quality Gates

1. **Gate 1: URL & Host Normalization**: Strips UTM tracking params, cleans whitespace, validates host against blacklists.
2. **Gate 2: Title De-noising**: Removes boilerplate phrases (`"CLICK HERE TO APPLY"`, `"ADVT NO 2026/04"` prefixes).
3. **Gate 3: Duplicate Fingerprinting**: Calculates hash on `(normalized_source_url, organization_name, cleaned_title)` to prevent duplicate listings.
4. **Gate 4: Quality Scoring**: Computes deterministic 0–100 score before publishing.
