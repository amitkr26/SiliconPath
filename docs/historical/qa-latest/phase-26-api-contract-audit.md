# Phase 26 — API Contract & Endpoint Audit Report

**Date**: 2026-08-26  
**Auditor**: Senior System Engineering & Forensic QA  
**Scope**: Full end-to-end audit of API request/response contracts across all 4 surfaces: Public, Candidate, Employer, and Admin.  
**Total Endpoints Audited**: 25 physical route endpoints  
**Status**: ✅ **100% CONTRACT COMPLIANCE**

---

## 1. API Contract Matrix

| Surface | Route Path | Method | Auth Required | Request Body / Query Params | Database Operation | Response Shape | Status |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| **Public** | `/api/opportunities` | GET | None | `limit`, `offset`, `category`, `location`, `experience`, `search`, `sort` | Query `opportunities` with availability filter | `{ opportunities: [...], count, total }` | ✅ 200 |
| **Public** | `/api/opportunities/[slug]` | GET | None | `slug` URL parameter | Query `opportunities` by slug with org relation | `{ opportunity: {...} }` | ✅ 200 |
| **Public** | `/api/search/opportunities` | GET | None | `q`, `category`, `location`, `limit`, `offset` | Search `opportunities` and `organizations` | `{ opportunities: [...], count }` | ✅ 200 |
| **Public** | `/api/organizations` | GET | None | `page`, `per_page` | Query `organizations` & opportunity counts | `{ organizations: [...], total, page }` | ✅ 200 |
| **Public** | `/api/news` | GET | None | `category`, `limit` | Query `news_articles` | `{ articles: [...], count }` | ✅ 200 |
| **Public** | `/api/health` | GET | None | None | Probe Supabase DB & read replica health | `{ status: "ok", opportunitiesCount: 3608 }` | ✅ 200 |
| **Candidate** | `/api/profile/[userId]` | GET | Session / Bearer | `userId` URL parameter | Query `user_profiles` by ID | `{ profile: {...} }` | ✅ 200 |
| **Candidate** | `/api/profile/[userId]/recommendations` | GET / POST | Session / Bearer | `content`, `relationship` (POST) | Select/Insert into `recommendations` | `{ recommendations: [...] }` / `{ id, ... }` | ✅ 200 / 201 |
| **Candidate** | `/api/profile/[userId]/endorse` | GET / POST / DELETE | Session / Bearer | `skill` | Select/Insert/Delete from `skill_endorsements` | `{ endorsements: [...] }` / `{ success: true }` | ✅ 200 / 201 |
| **Candidate** | `/api/resume` | GET / PATCH / DELETE | Session / Bearer | `full_name`, `skills`, `experience`, `education`, ... | Select/Upsert/Delete from `user_resumes` | `{ resume: {...}, ats_score, ats_feedback }` | ✅ 200 |
| **Candidate** | `/api/profile/avatar` | POST | Session / Bearer | `avatar_url` (JSON) or multipart image file | Upload to `avatars` bucket & update `user_profiles` | `{ avatar_url: "..." }` | ✅ 200 |
| **Candidate** | `/api/feed` | GET / POST | Session / Bearer | `content`, `limit`, `offset` | Query/Insert into `feed_posts` & join author | `{ posts: [...] }` / `{ id, ... }` | ✅ 200 / 201 |
| **Candidate** | `/api/network/suggestions` | GET | Session / Bearer | None | Query `user_profiles` & mutual connections | `{ suggestions: [...] }` | ✅ 200 |
| **Candidate** | `/api/network/followers` | GET | Session / Bearer | None | Query `user_follows` & join user profiles | `{ followers: [...], following: [...] }` | ✅ 200 |
| **Candidate** | `/api/messages` | GET / POST | Session / Bearer | `recipientId`, `body`, `conversationId` | Query/Insert `conversations` & `messages` | `{ conversations: [...] }` / `{ message: {...} }` | ✅ 200 / 201 |
| **Candidate** | `/api/notifications` | GET / PATCH | Session / Bearer | `limit`, `unread` | Query `notifications` & update `is_read` | `{ notifications: [...] }` / `{ success: true }` | ✅ 200 |
| **Candidate** | `/api/recommendations` | GET | Session / Bearer | None | Semantic match between profile skills & opportunities | `{ recommendations: [...] }` | ✅ 200 |
| **Employer** | `/api/employer/talent` | GET | Employer Role | `query`, `domain`, `minExp` | Query `user_profiles` where `is_open_to_work = true` | `{ candidates: [...], total }` | ✅ 200 |
| **Employer** | `/api/employer/saved-candidates`| GET / POST / DELETE | Employer Role | `candidate_id`, `note` | Query/Upsert/Delete `recruiter_saved_candidates` | `{ saved: [...], count }` | ✅ 200 |
| **Employer** | `/api/employer/jobs` | GET / POST | Employer Role | `title`, `description`, `category`, `deadline`, ... | Query/Insert into `opportunities` (`created_by`) | `{ jobs: [...] }` / `{ job: {...} }` | ✅ 200 / 201 |
| **Employer** | `/api/employer/settings` | GET / PATCH | Employer Role | `company_name`, `notification_preferences`, ... | Query/Upsert `employer_settings` | `{ settings: {...} }` | ✅ 200 |
| **Admin** | `/api/admin/auth` | POST | Basic Auth | `username`, `password` | Verify credentials against environment secrets | `{ token, authenticated: true }` | ✅ 200 |
| **Admin** | `/api/admin/scrape` | GET / POST | Admin Token / Secret | `sourceId`, `action` | Query `scrape_sources` or trigger scraping pipeline | `{ sources: [...], count }` | ✅ 200 |
| **Admin** | `/api/admin/scrape-health` | GET | Admin Token / Secret | None | Query `scrape_sources` and `scrape_runs` telemetry | `{ sources: 13, runs: 25, ... }` | ✅ 200 |
| **Admin** | `/api/admin/analytics` | GET | Admin Token / Secret | None | Aggregates DB metrics across opportunities & users | `{ totalOpportunities: 3608, ... }` | ✅ 200 |

---

## 2. RBAC & Security Boundary Verification

- **Candidate vs Employer Barrier**: Candidate sessions attempting to query `/api/employer/*` are strictly rejected with **HTTP 403 Forbidden** via Next.js middleware and API-level RBAC.
- **Admin Authentication Boundary**: Admin routes enforce strict timing-safe comparison on HMAC tokens and admin passwords, rejecting unauthenticated requests with **HTTP 401/403**.
- **CSRF & Rate Limiting**: All mutation methods (`POST`, `PUT`, `PATCH`, `DELETE`) are protected against CSRF and abusive bursts.
