# User Features

## Overview

BerojgarDegreeWala user module provides profiles, social connections, messaging, feed, and resume management for registered VLSI professionals.

## Current Status

Auth and basic user features are implemented. Social features (feed, connections, messaging, notifications) have database tables and some API routes but limited frontend.

## User Journey

### Sign Up → Onboarding → Browse
1. Register via email, Google, or GitHub (Supabase Auth)
2. Complete onboarding profile (name, title, skills, experience)
3. Browse opportunities and academy content
4. Save/bookmark opportunities
5. Connect with other professionals
6. Build and manage resume

## Implemented Features

### Authentication
- Email/password registration and login
- Google OAuth
- GitHub OAuth (configured but Supabase free tier only allows 2 OAuth providers)
- Magic link (planned)
- Password reset

### Profile (`/profile`)
- Display name, bio, avatar
- Job title, company
- Skills (tags)
- Education history
- Track completion badges
- Social links (LinkedIn, GitHub, Twitter)
- Settings (notifications, privacy)

### Bookmarks
- Save opportunities for later
- Quick apply from saved list
- Category tagging (planned)

### Resume Builder (`/resume`)
- Sections: summary, experience, education, skills, projects, certifications
- PDF download (planned)
- Auto-fill from profile (planned)

## Planned Features

### Feed
- Post updates, articles, questions
- Like, comment, share
- Follow users
- Algorithmic or chronological feed

### Connections
- Send/receive connection requests
- Mutual connections display
- Recommended connections based on skills
- Import contacts (planned)

### Messages
- Real-time messaging (WebSocket or polling)
- Conversation threads
- Read receipts
- File/image sharing

### Notifications
- Connection requests
- New messages
- Application updates
- Academy milestone completions
- Opportunity match alerts

## Privacy Controls

- Profile visibility (public, connections only, private)
- Activity status (online/offline)
- Block users
- Report/inappropriate content
- Data export (planned)
- Account deletion (planned)

## Related Documents

- [auth-flow.md](./auth-flow.md) — Authentication flow
- [social-features.md](./social-features.md) — Social feature details
