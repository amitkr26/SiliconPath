# Product Requirements Document

## Product Overview

BerojgarDegreeWala is a single-page web application with three integrated products: Opportunity Aggregator, BerojgarDegreeWala Academy, and BerojgarDegreeWala Network.

## Requirements by Product

### Opportunity Aggregator

**Must Have (P0)**
- Browse opportunities without login
- Search by keyword, category, location, deadline
- Filter by category, eligibility, location, deadline range
- View opportunity detail with apply redirect
- Mobile-responsive design
- Pagination with 20 items per page
- Category badges with color coding
- Deadline countdown with urgency indicators
- Verification badges for data quality
- RSS sitemaps for SEO

**Should Have (P1)**
- AI-powered natural language search
- Similar opportunities
- Calendar export for deadlines
- Email alerts for saved searches
- Opportunity sharing (social, copy link)

**Nice to Have (P2)**
- Salary range filtering
- Remote work filtering
- Company/organization comparison

### BerojgarDegreeWala Academy

**Must Have (P0)**
- Browse learning tracks without login
- Day-wise content structure
- YouTube video integration
- Practice quizzes per day
- Track progression (sequential day unlock)
- Gated assessments at end of each track
- Progress persistence (login required)

**Should Have (P1)**
- Certificate generation on track completion
- Resume builder with AI score
- Career roadmaps
- Downloadable resources

**Nice to Have (P2)**
- Hands-on lab integration (EDA Playground, etc.)
- Community discussion per day
- Mentor matching

### BerojgarDegreeWala Network

**Must Have (P0)**
- User profiles with skills, experience, education
- Connection requests and management
- Direct messaging between connections
- Social feed with posts, likes, comments
- Notifications for network activity

**Should Have (P1)**
- Company pages for employers
- Job posting for recruiters
- Talent pool search for employers
- AI-powered opportunity matching

**Nice to Have (P2)**
- Groups and communities
- Events and webinars
- Recommendation letters

## User Tiers

| Feature | Guest | Seeker | Provider | Admin |
|---------|-------|--------|----------|-------|
| Browse opportunities | ✓ | ✓ | ✓ | ✓ |
| Academy (learn) | ✓ | ✓ | ✓ | ✓ |
| Academy progress | LocalStorage | DB sync | DB sync | ✓ |
| Save opportunities | — | ✓ | — | ✓ |
| Profile | — | ✓ | ✓ | ✓ |
| Network/Connections | — | ✓ | ✓ | ✓ |
| Messaging | — | ✓ | ✓ | ✓ |
| Feed | — | ✓ | ✓ | ✓ |
| Post opportunities | — | — | ✓ | ✓ |
| Talent pool search | — | — | ✓ | ✓ |
| Admin dashboard | — | — | — | ✓ |
| Scraper management | — | — | — | ✓ |
