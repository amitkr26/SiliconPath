# Phase 30C: Unified User Onboarding & Persona Activation Audit

**Platform**: BerojgarDegreeWala  
**Audit Date**: August 28, 2026  
**Auditor**: Antigravity Architecture & RBAC Specialist  
**Design Mandate**: Single Unified Account with Progressive Capability Activation  
**Status**: **IMPLEMENTED & AUDITED**

---

## 1. Executive Summary

Phase 30C completes the modernization of user registration and onboarding. Rather than segregating users into rigid, mutually exclusive silos at signup, newly registered users select their primary intent from three additive options:

1. **Looking for Opportunities (Candidate)**: Activates candidate discovery, AI Resume Studio, direct applications, and career tracking.
2. **Hiring Talent (Employer)**: Activates the ATS applicant pipeline, job creation, and talent sourcing.
3. **Both (Unified)**: Activates both candidate discovery and employer recruitment tools simultaneously under a single login.

---

## 2. Onboarding Flow Architecture

```mermaid
flowchart TD
    Reg([New User Registration]) --> Onboard[/onboarding Page]
    Onboard --> IntentSelect{Choose Primary Intent}
    
    IntentSelect -->|Looking for Opportunities| CandOpt[Candidate Fields: Headline, Education, Skills, Target Domains]
    IntentSelect -->|Hiring Talent| EmpOpt[Employer Fields: Organization, Org Type, Website, Industry]
    IntentSelect -->|Both| BothOpt[All Candidate + Employer Fields]
    
    CandOpt --> SaveProfile[Update user_profiles & metadata]
    EmpOpt --> CreateOrg[Insert into organizations & user_profiles]
    BothOpt --> CreateBoth[Update user_profiles + Link Organization]
    
    SaveProfile --> Dashboard[/dashboard]
    CreateOrg --> EmpDash[/employer/dashboard]
    CreateBoth --> Dashboard
```

---

## 3. Form Field & Domain Taxonomy

- **Target Semiconductor Domains**:
  - `VLSI ASIC Design`
  - `FPGA & Digital Design`
  - `Embedded Systems & Firmware`
  - `Analog & Mixed Signal Layout`
  - `RTL & UVM Verification`
  - `Semiconductor Fabrication & Physics`
  - `PCB Design & Hardware QA`
  - `Robotics & Control Systems`
- **Education Levels**: B.Tech / B.E., M.Tech / M.E., Ph.D., B.Sc / M.Sc, Diploma, Self-Taught.
- **Experience Levels**: Fresher / Student (0 yrs), Junior (1–3 yrs), Mid-Level (3–5 yrs), Senior / Lead (5+ yrs).

---

## 4. Key Guarantees

1. **Zero Account Duplication**: A user never has to create a second account to recruit or seek jobs.
2. **Progressive Completion**: Essential identity fields (Name, Location) are captured initially; deeper career history can be populated progressively.
3. **Safe Storage**: Metadata is stored in `user_profiles.metadata` (JSONB) and mirrored to Supabase Auth `user_metadata` for fast client access.
