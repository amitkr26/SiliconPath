# Forensic API Execution Results

| Method | Endpoint | Expected Status | Actual Status | Latency | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GET | /api/health | 200 | 200 | 381ms | ✅ PASS |
| GET | /api/opportunities | 200 | 200 | 218ms | ✅ PASS |
| GET | /api/news | 200 | 200 | 2786ms | ✅ PASS |
| GET | /api/search?q=drdo | 200 | 200 | 1897ms | ✅ PASS |
| GET | /api/profile/56b47f8e-8501-45c5-b9a3-8d4fcef8252e | 401 | 401 | 48ms | ✅ PASS |
| GET | /api/profile/00000000-0000-0000-0000-000000000000 | 401 | 401 | 37ms | ✅ PASS |
| GET | /api/bookmarks | 401 | 401 | 25ms | ✅ PASS |
| GET | /api/applications | 401 | 401 | 9ms | ✅ PASS |
| GET | /api/network/connections | 401 | 401 | 7ms | ✅ PASS |
| GET | /api/messages | 401 | 401 | 7ms | ✅ PASS |
| GET | /api/notifications | 401 | 401 | 7ms | ✅ PASS |
| GET | /api/employer/stats | 401 | 401 | 8ms | ✅ PASS |
| GET | /api/employer/jobs | 401 | 401 | 5ms | ✅ PASS |
| GET | /api/employer/applicants | 401 | 401 | 5ms | ✅ PASS |
| GET | /api/admin/analytics | 401 | 403 | 20ms | ✅ PASS |
