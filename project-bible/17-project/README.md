# Project Management

## Overview

Project management artifacts for BerojgarDegreeWala: roadmap, milestones, sprints, prioritization framework, and contribution workflow.

## Development Phases

### Phase 0: Foundation (Complete)
- [x] Core opportunity scraping (332+ sources, 7 adapter types)
- [x] Data quality pipeline (deduplication, verification, AI parsing)
- [x] Public pages (opportunities, organizations, news, resources)
- [x] Academy curriculum (7 tracks, day-wise content, assessments)
- [x] Authentication (email, Google, GitHub)
- [x] Dark-first design system
- [x] CI/CD pipeline
- [x] Project bible documentation

### Phase 1: Social & Engagement (In Progress)
- [ ] Feed: posts, likes, comments
- [ ] Connections: requests, recommendations
- [ ] Messages: real-time chat
- [ ] Notifications: in-app + email
- [ ] Bookmarks and saved searches
- [ ] Resume builder
- [ ] User onboarding flow

### Phase 2: Employer Tools (Planned)
- [ ] Company profiles
- [ ] Job posting UI
- [ ] Application management dashboard
- [ ] Candidate search
- [ ] Employer verification

### Phase 3: AI & Personalization (Planned)
- [ ] Personalized opportunity recommendations
- [ ] AI-powered skill gap analysis
- [ ] Resume optimization suggestions
- [ ] Interview preparation assistant
- [ ] Smart notifications (relevant opportunities)

### Phase 4: Scale (Future)
- [ ] Mobile app (React Native or PWA)
- [ ] Multi-language support
- [ ] Community forums
- [ ] Mentorship program
- [ ] API marketplace for third-party integrations

## Prioritization Framework

### RICE Scores
- **Reach**: How many users will this affect?
- **Impact**: How much will this improve their experience?
- **Confidence**: How sure are we of reach and impact?
- **Effort**: How much development time is required?

### Priority Levels
| Priority | Definition | RICE Threshold |
|----------|------------|----------------|
| P0 | Critical: must do now | Impact 3+ |
| P1 | Important: do this sprint | RICE score > 20 |
| P2 | Valuable: do this month | RICE score > 10 |
| P3 | Nice to have: this quarter | RICE score > 5 |
| P4 | Future: backlog | RICE score < 5 |

## Contribution Workflow

### Branch Strategy
- `main` — production branch, protected
- `feature/*` — feature branches from main
- `bugfix/*` — bug fix branches
- `docs/*` — documentation changes
- `project-bible/*` — project-bible documentation

### PR Process
1. Create branch from `main`
2. Make changes + add tests
3. Run `npm run lint && npm run typecheck && npm test`
4. Create PR with description and screenshots (if UI)
5. Request review
6. Squash-merge to `main`

## Related Documents

- [roadmap.md](./roadmap.md) — Full product roadmap
- [milestones.md](./milestones.md) — Milestone definitions
- [sprint-templates.md](./sprint-templates.md) — Sprint planning templates
