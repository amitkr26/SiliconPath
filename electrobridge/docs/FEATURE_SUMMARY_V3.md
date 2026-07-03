# Feature Summary V3 — Resume Builder + Community Forum

## Files Created

### Migrations
- `supabase/migrations/20260702000001_resume_builder.sql` — user_resumes table, RLS, ATS sync trigger
- `supabase/migrations/20260702000002_community.sql` — community_posts, community_comments, community_votes tables, RLS, toggle_upvote function

### API Routes
- `src/app/api/resume/route.ts` — GET/POST for user resume with AI ATS scoring
- `src/app/api/community/posts/route.ts` — GET (list with filters) / POST (create post)
- `src/app/api/community/posts/[id]/route.ts` — GET (single post + comments) / DELETE
- `src/app/api/community/vote/route.ts` — POST toggle upvote via RPC
- `src/app/api/community/comments/route.ts` — POST add comment

### Pages
- `src/app/resume/page.tsx` — 6-step AI Resume Builder (Personal, Education, Skills, Experience, Projects, Publications) with live ATS preview, save & score, PDF export via print
- `src/app/resume/loading.tsx` — Loading skeleton
- `src/app/community/page.tsx` — Community forum with category tabs, post cards, upvote, new post modal, empty state
- `src/app/community/[id]/page.tsx` — Post detail with comments, upvoting, comment input

## Files Modified

- `src/components/Navbar.tsx` — Added Community (MessageSquare) and Resume (FileText) links to nav
- `src/app/globals.css` — Added @media print CSS for resume PDF export
- `src/app/sitemap.ts` — Added /login, /signup static routes
- `src/app/dashboard/page.tsx` — Build Resume links to /resume, score card shows View/Build links, status dropdown with PATCH

## Build Stats
- 198 static pages generated (up from 194)
- 0 TypeScript errors
- All existing pages intact
