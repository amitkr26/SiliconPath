# Route & API Access Matrix

**Platform**: BerojgarDegreeWala  
**Document Version**: 1.0 (Phase 30 Unified Architecture)  

---

## 1. Frontend Route Access & Protection Matrix

| Route Pattern | Required Auth | Role / Capability | Required Permission | Unauthenticated Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Public | Any | None | Render Public Home / Personalized if Auth |
| `/opportunities` | Public | Any | `opportunities.read` | Render Opportunity Listings & Search |
| `/opportunities/[slug]` | Public | Any | `opportunities.read` | Render Job Details; Apply button prompts Login |
| `/academy/*` | Public | Any | None | Render Curriculum; Progress tracked if Auth |
| `/news/*` | Public | Any | None | Render Articles & RSS Feeds |
| `/companies/*` | Public | Any | None | Render Company Profile & Open Roles |
| `/organizations/*` | Public | Any | None | Render Verified Organization Details |
| `/people/[username]` | Public | Any | `users.read` | Render Public Profile; Endorse prompts Login |
| `/search` | Public | Any | None | Render Search Results across all entities |
| `/ask-ai` | Public | Any | None | Render AI Career Assistant (Rate-limited for Guests) |
| `/login`, `/signup` | Public | Unauthenticated | None | Render Auth Forms |
| `/dashboard` | **Authenticated** | Candidate | None | Redirect to `/login?redirectTo=/dashboard` |
| `/profile`, `/profile/me` | **Authenticated** | Candidate | None | Redirect to `/login?redirectTo=/profile` |
| `/resume` | **Authenticated** | Candidate | None | Redirect to `/login?redirectTo=/resume` |
| `/applications` | **Authenticated** | Candidate | None | Redirect to `/login?redirectTo=/applications` |
| `/saved` | **Authenticated** | Candidate | `opportunities.bookmark`| Redirect to `/login?redirectTo=/saved` |
| `/feed` | **Authenticated** | Candidate / Employer | None | Redirect to `/login?redirectTo=/feed` |
| `/network` | **Authenticated** | Candidate / Employer | None | Redirect to `/login?redirectTo=/network` |
| `/messages` | **Authenticated** | Candidate / Employer | None | Redirect to `/login?redirectTo=/messages` |
| `/notifications` | **Authenticated** | Candidate / Employer | None | Redirect to `/login?redirectTo=/notifications` |
| `/post-job` | **Authenticated** | Employer / Admin | `opportunities.create` | Redirect to `/login?redirectTo=/post-job` |
| `/employer/*` | **Authenticated** | Employer / Admin | `organizations.manage` | Redirect to `/login?redirectTo=/employer` |
| `/admin/*` | **Authenticated** | Admin / Owner | `admin.access` | Return 403 Forbidden / Admin Login |

---

## 2. API Endpoint Protection Matrix

| API Endpoint | Methods | Auth Mechanism | Required Permission | Unauthorized Response |
| :--- | :--- | :--- | :--- | :--- |
| `/api/opportunities` | `GET` | Public | `opportunities.read` | 200 OK |
| `/api/opportunities` | `POST` | Bearer JWT / Cookie | `opportunities.create` | 401 / 403 |
| `/api/opportunities/[id]` | `PATCH`, `DELETE`| Bearer JWT / Cookie | `opportunities.create` (Owner) | 403 Forbidden |
| `/api/applications` | `GET`, `POST` | Bearer JWT / Cookie | `opportunities.apply` | 401 Unauthorized |
| `/api/feed` | `GET`, `POST` | Bearer JWT / Cookie | Authenticated | 401 Unauthorized |
| `/api/feed/posts/[id]` | `PATCH`, `DELETE`| Bearer JWT / Cookie | Author Only | 403 Forbidden |
| `/api/messages` | `GET`, `POST` | Bearer JWT / Cookie | Conversation Participant | 401 / 403 |
| `/api/notifications` | `GET`, `PATCH` | Bearer JWT / Cookie | Recipient Only | 401 Unauthorized |
| `/api/employer/applicants`| `GET`, `PATCH` | Bearer JWT / Cookie | `opportunities.create` | 403 Forbidden |
| `/api/employer/talent` | `GET` | Bearer JWT / Cookie | Employer Role | 403 Forbidden |
| `/api/employer/invite` | `POST` | Bearer JWT / Cookie | Employer Role | 403 Forbidden |
| `/api/admin/analytics` | `GET` | Password / HMAC Token | `analytics.read` | 403 Forbidden |
| `/api/admin/scrapers` | `GET`, `POST` | Password / HMAC Token | `scrapers.run` | 403 Forbidden |
| `/api/cron/*` | `GET`, `POST` | `CRON_SECRET` Header | `cron.execute` | 403 Forbidden |
