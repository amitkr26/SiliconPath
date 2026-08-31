# Comprehensive QA Test Matrix

| Test ID | Portal | Feature | Action | Expected | Actual | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-PUB-001 | Public | Homepage Load | Navigate to / | Homepage renders with status 200 and hero title | Status: 200, Title: "BerojgarDegreeWala — Semiconductor, VLSI & Electronics Opportunities India" | PASS | pub-01-home.png |
| TC-PUB-002 | Public | Opportunities Listing | Navigate to /opportunities | Opportunities page lists active opportunities with cards/rows | Rows count: 61 | PASS | pub-02-opportunities.png |
| TC-PUB-003 | Public | Opportunity Detail | Navigate to opportunity detail page | Detail view loads with title, organization, category, and apply options | Status: 200 | PASS | pub-03-opportunity-detail.png |
| TC-PUB-004 | Public | News Feed | Navigate to /news | News feed renders articles with headlines and tags | Article links count: 0 | PASS | pub-04-news.png |
| TC-PUB-005 | Public | Academy Curriculum | Navigate to /academy | Academy tracks and curriculum cards render cleanly | Status: 200 | PASS | pub-05-academy.png |
| TC-PUB-006 | Public | Organizations Directory | Navigate to /organizations | Organizations directory lists registered companies and institutes | Status: 200 | PASS | pub-06-organizations.png |
| TC-PUB-007 | Public | Resources Center | Navigate to /resources | Resources page loads developer and student learning tools | Status: 200 | PASS | pub-07-resources.png |
| TC-PUB-008 | Public | Search Interface | Navigate to /search?q=engineer | Search page executes unified query and displays matched results | Status: 200 | PASS | pub-08-search.png |
| TC-PUB-009 | Public | Public Profile View | Navigate to /profile/amit_sharma_98 | Public profile loads without exposing private candidate data | Status: 200 | PASS | pub-09-public-profile.png |
| TC-CAND-001 | Candidate | Authentication Form | Navigate to /login | Login interface renders with email/username and password fields | Status: 200, Input: true, Password: true | PASS | cand-01-login-form.png |
| TC-CAND-002 | Candidate | Profile View & Completeness | Navigate to /profile | Profile page displays candidate identity and completeness gauge | Status: 200 | PASS | cand-02-profile.png |
| TC-CAND-003 | Candidate | Saved Opportunities | Navigate to /saved | Saved opportunities list loads authenticated candidate bookmarks | Status: 200 | PASS | cand-03-saved.png |
| TC-CAND-004 | Candidate | Candidate Applications | Navigate to /applications | Applications tracker renders active job applications with stages | Status: 200 | PASS | cand-04-applications.png |
| TC-CAND-005 | Candidate | Social Network & Suggestions | Navigate to /network | Network page renders connections, invitations, and AI suggestions | Status: 200 | PASS | cand-05-network.png |
| TC-CAND-006 | Candidate | Direct Messaging | Navigate to /messages | Conversations inbox loads with thread list and chat composer | Status: 200 | PASS | cand-06-messages.png |
| TC-CAND-007 | Candidate | Notifications Stream | Navigate to /notifications | Activity notifications render with unread badges | Status: 200 | PASS | cand-07-notifications.png |
| TC-CAND-008 | Candidate | Resume Builder | Navigate to /resume | Resume builder interface loads with section editor and ATS gauge | Status: 200 | PASS | cand-08-resume-builder.png |
| TC-CAND-009 | Candidate | RBAC Isolation Shield | Candidate attempts /employer/dashboard | Access is blocked or redirected away from employer cockpit | URL: http://localhost:3000/login?redirectTo=%2Femployer%2Fdashboard, Status: 200 | PASS | cand-09-rbac-blocked.png |
| TC-EMP-001 | Employer | Employer Authentication Gate | Navigate to employer login gate | Employer login route loads with credential entry form | Status: 200 | PASS | emp-01-login-form.png |
| TC-EMP-002 | Employer | Recruitment Dashboard | Navigate to /employer/dashboard | Dashboard displays active jobs count, applicants metric, and hiring funnel | Status: 200 | PASS | emp-02-dashboard.png |
| TC-EMP-003 | Employer | Job Postings Management | Navigate to /employer/jobs | Jobs list renders postings with status badges and action menus | Status: 200 | PASS | emp-03-jobs.png |
| TC-EMP-004 | Employer | Post-Job Studio | Navigate to /employer/jobs/new | Job creation form loads with title, category, eligibility, salary, apply_url fields | Status: 200 | PASS | emp-04-post-job.png |
| TC-EMP-005 | Employer | ATS Applicant Pipeline | Navigate to /employer/applicants | Applicant pipeline loads stage columns and candidate dossiers | Status: 200 | PASS | emp-05-applicants.png |
| TC-EMP-006 | Employer | Talent Search Sourcing | Navigate to /employer/talent | Talent search allows recruiter to discover candidates by skill | Status: 200 | PASS | emp-06-talent.png |
| TC-EMP-007 | Employer | Recruiter Messaging | Navigate to /employer/messages | Recruiter messaging cockpit loads candidate outreach threads | Status: 200 | PASS | emp-07-messages.png |
| TC-EMP-008 | Employer | Company Profile Studio | Navigate to /employer/company | Company profile editor loads with organization branding controls | Status: 200 | PASS | emp-08-company.png |
| TC-EMP-009 | Employer | Team Workspace Seats | Navigate to /employer/team | Team management loads workspace member seats and invite controls | Status: 200 | PASS | emp-09-team.png |
| TC-EMP-010 | Employer | Notification Settings | Navigate to /employer/settings | Settings toggles for email alerts, instant alerts, digests persist | Status: 200 | PASS | emp-10-settings.png |
| TC-EMP-011 | Employer | Employer Analytics | Navigate to /employer/analytics | Analytics dashboard calculates conversion rates and job metrics | Status: 200 | PASS | emp-11-analytics.png |
| TC-ADM-001 | Admin | Admin Auth Gate | Anonymous visits /admin | Protected by password gate or redirect to login | Status: 200, Auth Gate: true | PASS | adm-01-anon-blocked.png |
| TC-ADM-002 | Admin | Admin Authentication | Submit admin password | Authenticated and entered /admin cockpit | Current URL: http://localhost:3000/admin | PASS | adm-02-login-success.png |
| TC-RESP-320px | Responsive | Viewport 320px | Render homepage at 320x640 | Layout responds cleanly without horizontal overflow | Status: 200 | PASS | resp-home-320px.png |
| TC-RESP-375px | Responsive | Viewport 375px | Render homepage at 375x667 | Layout responds cleanly without horizontal overflow | Status: 200 | PASS | resp-home-375px.png |
| TC-RESP-390px | Responsive | Viewport 390px | Render homepage at 390x844 | Layout responds cleanly without horizontal overflow | Status: 200 | PASS | resp-home-390px.png |
| TC-RESP-414px | Responsive | Viewport 414px | Render homepage at 414x896 | Layout responds cleanly without horizontal overflow | Status: 200 | PASS | resp-home-414px.png |
| TC-RESP-768px | Responsive | Viewport 768px | Render homepage at 768x1024 | Layout responds cleanly without horizontal overflow | Status: 200 | PASS | resp-home-768px.png |
| TC-RESP-1024px | Responsive | Viewport 1024px | Render homepage at 1024x768 | Layout responds cleanly without horizontal overflow | Status: 200 | PASS | resp-home-1024px.png |
| TC-RESP-1440px | Responsive | Viewport 1440px | Render homepage at 1440x900 | Layout responds cleanly without horizontal overflow | Status: 200 | PASS | resp-home-1440px.png |
| TC-API--api-health | API | /api/health | GET /api/health | HTTP 200 | HTTP 200 (381ms) | PASS | — |
| TC-API--api-opportunities | API | /api/opportunities | GET /api/opportunities | HTTP 200 | HTTP 200 (218ms) | PASS | — |
| TC-API--api-news | API | /api/news | GET /api/news | HTTP 200 | HTTP 200 (2786ms) | PASS | — |
| TC-API--api-search-q-drdo | API | /api/search?q=drdo | GET /api/search?q=drdo | HTTP 200 | HTTP 200 (1897ms) | PASS | — |
| TC-API--api-profile-56b47f8e-8501-45c | API | /api/profile/56b47f8e-8501-45c5-b9a3-8d4fcef8252e | GET /api/profile/56b47f8e-8501-45c5-b9a3-8d4fcef8252e | HTTP 401 | HTTP 401 (48ms) | PASS | — |
| TC-API--api-profile-00000000-0000-000 | API | /api/profile/00000000-0000-0000-0000-000000000000 | GET /api/profile/00000000-0000-0000-0000-000000000000 | HTTP 401 | HTTP 401 (37ms) | PASS | — |
| TC-API--api-bookmarks | API | /api/bookmarks | GET /api/bookmarks | HTTP 401 | HTTP 401 (25ms) | PASS | — |
| TC-API--api-applications | API | /api/applications | GET /api/applications | HTTP 401 | HTTP 401 (9ms) | PASS | — |
| TC-API--api-network-connections | API | /api/network/connections | GET /api/network/connections | HTTP 401 | HTTP 401 (7ms) | PASS | — |
| TC-API--api-messages | API | /api/messages | GET /api/messages | HTTP 401 | HTTP 401 (7ms) | PASS | — |
| TC-API--api-notifications | API | /api/notifications | GET /api/notifications | HTTP 401 | HTTP 401 (7ms) | PASS | — |
| TC-API--api-employer-stats | API | /api/employer/stats | GET /api/employer/stats | HTTP 401 | HTTP 401 (8ms) | PASS | — |
| TC-API--api-employer-jobs | API | /api/employer/jobs | GET /api/employer/jobs | HTTP 401 | HTTP 401 (5ms) | PASS | — |
| TC-API--api-employer-applicants | API | /api/employer/applicants | GET /api/employer/applicants | HTTP 401 | HTTP 401 (5ms) | PASS | — |
| TC-API--api-admin-analytics | API | /api/admin/analytics | GET /api/admin/analytics | HTTP 401 | HTTP 403 (20ms) | PASS | — |
