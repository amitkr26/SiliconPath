# 17-DATA-FLOW-MAP — End-to-End Application Data Flows

```
1. CANDIDATE APPLICATION FLOW:
Candidate Browser ──► POST /api/opportunities/[id]/apply ──► Supabase Auth Verification ──► Insert applications (status='applied') ──► Employer ATS Pipeline Notification

2. EMPLOYER JOB POSTING FLOW:
Employer Studio ──► POST /api/employer/jobs ──► RBAC Validation (employer/provider) ──► Insert opportunities (created_by=uid, employer_id=uid) ──► Public Stream Discovery

3. DIRECT MESSAGING FLOW:
Sender ──► POST /api/messages ──► Verify Connection/Application ──► Insert messages ──► Trigger unread notification badge
```
