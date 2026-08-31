**Last Verified:** 2026-08-30 · **Status:** Current · **Scope:** User model and profile architecture**

# User Features (Candidates)

## Overview

Candidate-facing features for registered users: profile, resume, saved opportunities, applications, academy progress, and the social layer (network, messaging, notifications, feed). E2E-verified on production (9/9 passing, 2026-08-18).

## Implemented

- **Profile** (`/profile`) — view/edit, username uniqueness, `PUBLIC_PROFILE_FIELDS` allowlist for public views, view counter via RPC
- **Candidate Professional Sub-Resources (Phase 9)** — Experiences, Educations, Projects, Certifications, Achievements (relational PostgreSQL tables with RLS and foreign keys)
- **Profile Completeness Engine** — Deterministic 0–100% calculation across identity, avatar, bio, location, skills, experience, education, projects, career preferences
- **Resume** (`/resume`) — CRUD, ATS score, ai-suggest, `parse-resume` via GCP Document AI
- **Saved opportunities** (`/saved`)
- **Applications** (`/applications`) — idempotent submission; status whitelist: `applied | screening | shortlisted | interview | accepted | rejected`
- **Academy progress** — guest progress stored locally, authenticated progress in DB
- **Network** — suggestions (explainable score), connect (pending/accept/reject/withdraw/disconnect), connections list, mutual connections graph intersection, follow/unfollow, followers/following
- **Messaging** — conversations keyed by `participant_a`/`participant_b`, direct candidate & employer reachout, read receipts
- **Notifications** — list, unread count, mark read
- **Feed** — post, like, comment, repost; counts trigger-maintained
- **Recommendations** — keyword-scored opportunity recommendations
- **Skill endorsements**
- **Community** — posts, comments, vote

## Authentication

- Email/password + Google OAuth via Supabase Auth
- No GitHub OAuth
- No user alerts/email-digest except the weekly digest (Resend) for subscribers

## Related Documents

None.