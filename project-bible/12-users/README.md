# User Features (Candidates)

## Overview

Candidate-facing features for registered users: profile, resume, saved opportunities, applications, academy progress, and the social layer (network, messaging, notifications, feed). E2E-verified on production (9/9 passing, 2026-08-18).

## Implemented

- **Profile** (`/profile`) — view/edit, username uniqueness, `PUBLIC_PROFILE_FIELDS` allowlist for public views, view counter via RPC
- **Resume** (`/resume`) — CRUD, ATS score, ai-suggest, `parse-resume` via GCP Document AI
- **Saved opportunities** (`/saved`)
- **Applications** (`/applications`) — idempotent submission; status whitelist: `applied | submitted | reviewed | shortlisted | accepted | rejected`
- **Academy progress** — guest progress stored locally, authenticated progress in DB
- **Network** — suggestions, connect (pending/accept/reject/withdraw), connections list, follow/unfollow, followers/following
- **Messaging** — conversations keyed by `participant_a`/`participant_b`, read receipts
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