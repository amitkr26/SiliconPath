# Security & IDOR Forensic Results

- **Candidate to Employer RBAC:** PASS (Candidate 1 blocked from /employer/dashboard)
- **Anonymous to Admin RBAC:** PASS (Anonymous blocked from /admin)
- **API Authorization Envelopes:** PASS (401 returned for unauthenticated calls to /api/bookmarks, /api/applications, /api/messages, /api/employer/*)
- **Search Path Injection Resistance:** PASS (All 14 Supabase functions execute with immutable search_path)
- **Multi-Tenant Scoping:** PASS (All queries enforce WHERE employer_id = auth.uid())
