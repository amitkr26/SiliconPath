# Roadmap

> **This document supersedes the roadmap section inside `PROJECT_AUDIT.md`.** The roadmap there will be replaced with a one-line pointer to this file.

---

## 1. Current State Summary

JobsAI is a production-deployed aggregation platform for semiconductor, electronics, and research opportunities. As of the latest audit:

- **Scraping engine** pulls from 30+ RSS feeds and 3+ HTML targets across news and opportunities.
- **Filtering pipeline** applies 380+ inclusion keywords and 45 blocklist regex patterns.
- **Deduplication** is enforced via `source_url` UNIQUE constraints with tier-based authority.
- **Database** runs on Supabase (Postgres) with a full schema covering opportunities, news, companies, user profiles, bookmarks, applications, and notifications.
- **Authentication** supports email/password; Google OAuth is wired but needs client ID/secret configured in Supabase.
- **UI** is a Next.js App Router application with dark theme, responsive layout, opportunity/news cards, bookmarking, role-based access (user/admin), and a basic admin panel.
- **Deployment** targets Vercel but secrets are unset, blocking automated CI/CD.

---

## 2. Short Term (Current Sprint)

### 2.1 Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel

**Why:** Error tracking is non-functional. Every production crash is invisible.

**Steps:**
1. Create a Sentry project for JobsAI.
2. Copy the DSN.
3. Add `NEXT_PUBLIC_SENTRY_DSN` to Vercel environment variables.
4. Verify by triggering a test error in production.

### 2.2 Enable Google OAuth

**Why:** Email-only auth is a barrier; Google login is the most requested feature.

**Steps:**
1. Create OAuth credentials in Google Cloud Console.
2. Set the Client ID and Client Secret in Supabase Authentication settings.
3. Enable Google provider in the Supabase dashboard.
4. Test sign-in flow locally and in preview deployments.

### 2.3 Wire Notification Creation into Remaining API Routes

**Why:** Users receive no in-app or email notifications for new opportunities, bookmark updates, or application status changes.

**Steps:**
1. Audit all `INSERT`/`UPDATE` operations across API routes.
2. Where notifications are missing, call the notification service (`/lib/notifications.ts`).
3. Update the notifications table schema to support additional event types if needed.
4. Add a "Mark all as read" endpoint.

### 2.4 Implement Open to Work Toggle + Admin Talent Pool

**Why:** Makes user profiles recruiter-visible; unlocks the talent-pool feature.

**Steps:**
1. Add `open_to_work` boolean column to `profiles` table.
2. Add a toggle in the user profile settings UI.
3. Create an admin-only view listing all `open_to_work = true` profiles with filters (role, location, experience).
4. Add "Contact" action (reveals profile email to admin).

---

## 3. Medium Term (Next 1–2 Months)

### 3.1 E2E Tests with Playwright

Cover critical user flows: sign-up, sign-in, browse opportunities, bookmark, apply, admin operations. Run in CI.

### 3.2 Admin Panel Updates

Add bulk actions, opportunity moderation queue, source health dashboard, and activity audit log.

### 3.3 CDN for Static Assets

Migrate images, icons, and other static assets to a CDN (Cloudflare R2 or AWS CloudFront) to reduce server load and improve global load times.

### 3.4 Database Backup Verification

Automate daily backups, verify restore integrity, and set up alerts for failed backups. Document the recovery procedure.

### 3.5 Light Mode Toggle

Add a theme switcher (dark/light/system) persisted in local storage and user preferences.

### 3.6 OpenAPI / Swagger Docs

Generate OpenAPI 3.0 specs for all public API routes. Serve via `/api/docs` using Swagger UI or Scalar.

### 3.7 Google OAuth Refresh Token Handling

Ensure refresh tokens are persisted and rotated correctly to avoid user session drops.

---

## 4. Long Term (3+ Months)

### 4.1 Real-Time Messaging (WebSocket / Supabase Realtime)

Enable direct messaging between recruiters and candidates. Use Supabase Realtime for presence and chat.

### 4.2 Mobile App (React Native or PWA)

Build a companion mobile app with push notifications, offline bookmark access, and one-tap apply.

### 4.3 AI-Powered Company Recommendations

Use embedding-based similarity (OpenAI / Cohere) to recommend companies and roles based on the user's profile, bookmark history, and past applications.

### 4.4 Talent Pool / Recruiter Dashboard

A full recruiter workspace: search candidates, manage job postings, schedule interviews, track pipeline. Linked to the Open to Work toggle.

---

## 5. Known Technical Debt

| Issue | Priority | Severity | Notes |
|---|---|---|---|
| `calendar_exports` table exists but never written to | Low | Minor | Drop or implement |
| `telegram_subscribers` has no subscription UI | Low | Minor | No current demand |
| Cron jobs (`archive-news`, `sync-replica`) have never triggered | Medium | Medium | Need verification |
| No E2E tests | High | High | Blocks confident refactoring |
| No monitoring / alerting | High | High | Sentry DSN not set |
| Rate limiter is in-memory (lost on restart) | Medium | Medium | Migrate to Upstash/Betterstack |
| Vercel deploy via GitHub Actions blocked (secrets not set) | High | High | Set secrets |
| Sentry DSN not set | High | High | Short-term item |
| No Neon/Supabase2 migration files in repo | Medium | Low | Schema drift risk |

---

## 6. Prioritization Rationale

Aggregation and data integrity always take precedence over UI polish and secondary features. The reasoning:

1. **The core value proposition** of JobsAI is a comprehensive, accurate, and up-to-date database of semiconductor opportunities. Without reliable data, no amount of UI refinement matters.
2. **Data quality compounds.** Every source added, every dedup rule improved, every verification check deployed increases trust and user retention.
3. **Infrastructure debt slows everything.** Until Sentry, CI/CD, and monitoring are operational, every change is deployed blind.
4. **Authentication and notifications** are the minimum viable engagement loop. Without them, users arrive, browse once, and never return.

The sprint order is therefore: **Data infrastructure → Auth/Notifications → Admin tooling → Tests → UI features → Advanced features.**
