# Frontend Redesign Audit — Phase 1

Date: 2026-08-20
Scope: `frontend/` only. Backend, schema, API contracts, scraper logic, and worker are **out of scope** and must not change.
Method: full route inventory (67 page files, 5 layouts), component catalog (32 components), token forensics (3 sources), code-level inspection of landing/shell/cards. No browser screenshots taken this pass; visual QA deferred to Playwright step in the program.

## 1. What exists today (source of truth = live implementation)

- **Framework:** Next.js 14.2.21 (App Router), Tailwind 3.4.1, lucide-react icons, `@tailwindcss/typography` (only plugin). No shadcn. No dark mode. Default breakpoints.
- **Design language:** Neo-Brutalist ("Brutalish") — light background `#FAF9F6`, white cards with 2–4px `#0F172A` borders, hard offset shadows (`4px 4px 0 0 #0F172A`), electric blue accent `#2563EB`, heavy `font-black` + uppercase tracking-wider micro-labels. Distinct, fast, memorable — genuinely not AI-default, but applied with **no restraint**.
- **Typography:** Space Grotesk (display) + Inter (body). `font-black` (900) overused; nearly every label is uppercase tracking-wider; body copy frequently `text-xs`/`text-sm` even for substantive paragraphs.
- **Radius chaos:** `rounded-xl` (14px), `rounded-2xl` (18px), `rounded-3xl` (24px), `rounded-lg` (12px) used interchangeably with no semantic rule.
- **Border chaos:** `border-2` / `border-3` / `border-4` all in use with no semantic rule.

## 2. Token forensics — three conflicting sources

| Source | Intent | Reality |
|---|---|---|
| `project-bible/20-machine-specs/design-tokens.json` | Dark cyber theme: `#0A0E1A` bg, cyan `#22D3EE` accent, glassmorphism glow, dark surfaces | **Never implemented.** Purely aspirational spec. |
| `frontend/tailwind.config.ts` | Light brutalist theme | **Misleading aliases:** `navy: #FAF9F6` (navy = off-white!), `cyan: #2563EB` (cyan = blue!), `--accent-yellow: #FACC15` in config but `--accent-yellow: #2563EB` in CSS vars. |
| `frontend/src/app/globals.css` `:root` | Light brutalist theme | **Same corruption:** `--accent-yellow: #2563EB` (yellow is blue), `--warning: #2563EB` (warning is blue), `--border-subtle: #0F172A` (subtle = full black). Dead `glass-premium`/`glass-nav`/`btn-glow` aliases kept from the glass era. **Two competing scrollbar rules** (blue-on-dark in one block, yellow-on-light in another) — the second block silently overrides the first. |

**Decision (per program: "live implementation is the source of truth; do not redesign based only on documentation"):** keep the light neo-brutalist identity and **refine it into an editorial, restrained, professional system**. Do NOT flip to the un-implemented dark cyber spec — that is a full rebuild with no behavioral gain and directly contradicts the "preserve brand recognition but refine usage" instruction.

## 3. Concrete defects found

1. **`cn()` does not use tailwind-merge** (`frontend/src/lib/utils.ts`) though `tailwind-merge` is installed — class conflicts silently win by CSS order instead of by specificity logic. Fix first: every downstream style fix depends on it.
2. **Token aliases lie.** `navy`, `cyan`, `accent-yellow`, `warning` resolve to colors that contradict their names. Components using `bg-navy`, `text-cyan-*` etc. render with colors nobody intended.
3. **CSS vars and Tailwind config disagree** on the same semantic tokens (`--accent-yellow`, `--warning`, `--border-subtle`, radius scale).
4. **No primitives layer.** 32 bespoke components + every page inline-repeats the same brutal recipe: `border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] rounded-2xl font-black uppercase tracking-wider`. Landing page alone repeats the pattern ~20 times.
5. **Card-on-card.** Everything is a bordered card with a hard shadow, including content that should be flat text (stats strips, portal feature blocks, section headers). No hierarchy between card levels.
6. **ALL-CAPS micro-label spam.** Every section header carries a blue/emerald/purple uppercase pill. The accent color changes per section without meaning (blue=opps, emerald=academy, purple=news) — decorative, not semantic.
7. **Scrollbar styles fight each other** (duplicate blocks; blue vs yellow). Net effect arbitrary.
8. **`font-black` saturation.** Headlines at 900 are fine in small doses; here nearly all text weights are 700–900, including paragraphs and body copy, eroding the hierarchy.
9. **`bg-secondary: #FEF9C3`** (yellow) is used for secondary surfaces — a pale yellow that reads as "warning" against the blue/off-white palette.
10. **Dead CSS aliases** (`glass-premium`, `glass-nav`, `btn-glow`, `.badge-brutal` with duplicate `color` declaration) — remnants of a pre-brutalist era, confusing future editors.

## 4. Route/component surface to redesign

- **67 page routes**, grouped: landing/static (7), opportunities (4), news (2), academy (4), social (8), profile/tools (11), auth (3), employer (6), admin (11), resources (11). 11 are pure redirects — no UI.
- **32 components**; the highest-leverage shared ones: `Navbar`, `Footer`, `AppLayout`, `OpportunityCard`, `OpportunityRow`, `NewsCard`, `CategoryBadge`, `VerificationBadge`, `FilterBar`, `SearchBar`, `DeadlineCountdown`, `ApplyButton`, `LoadingSkeleton`, `HeroSearch`.
- Loading/error/not-found states exist for most major routes; admin + employer + social lack error boundaries (functionality gap, noted, not a redesign task).

## 5. Redesign principles (agreed, drives all agents)

1. **One token source of truth** = `tailwind.config.ts` (extended); CSS vars in `globals.css` must mirror it exactly or be deleted.
2. **Fix the lies:** rename `navy`/`cyan` aliases to honest names; fix `accent-yellow`/`warning` values; delete dead glass classes.
3. **Semantic radii/borders:** 1 token per use (e.g. card = `rounded-2xl` + `border-2`; pill = `rounded-full`; no ad-hoc `border-3`/`border-4`/`rounded-3xl` outside the two showcase hero blocks).
4. **Primitives layer** (`components/ui/`): `Button`, `Badge`, `Card`, `SectionHeader`, `Input`/`Select` — encapsulate the brutal recipe once; pages stop hand-rolling it.
5. **Restrained type:** display headings 900, body/paragraph 400–600, micro-labels uppercase only where genuinely a label; kill ALL-CAPS where it is decorative.
6. **Flatten hierarchy:** primary action = filled blue + hard shadow; secondary action = white + border; tertiary = plain text link. One accent per view, chosen semantically.
7. **Preserve:** the hard-shadow language (brand), the blue accent, Space Grotesk display font, off-white background, uppercase section eyebrow (kept but subdued).
8. **No new dependencies.** Tailwind + lucide-react + tailwind-merge (already installed) are the entire toolkit.

## 6. Evidence pointers (files touched by the redesign)

- `frontend/tailwind.config.ts` — token reconciliation (AGENT 1)
- `frontend/src/app/globals.css` — var cleanup, dead CSS removal, scrollbar single rule (AGENT 1)
- `frontend/src/lib/utils.ts` — `cn()` + tailwind-merge (AGENT 1)
- `frontend/src/components/ui/*` — new primitives (AGENT 1)
- `frontend/src/components/Navbar.tsx`, `Footer.tsx`, `AppLayout.tsx` — shell (AGENT 2)
- `frontend/src/app/page.tsx` + `HeroSearch` — landing (AGENT 3)
- Page groups — AGENTS 4–10 (opportunities, academy, news, social, profile/tools, auth/employer, admin)
- AGENT 8 (Admin dark-shell + employer group): all 11 `frontend/src/app/admin/*` routes + `admin/_components/AIAnalyticsPanel.tsx` migrated off the lying legacy tokens (`bg-navy`/`text-navy`/`bg-cyan`/`text-text-*`/`bg-surface`/`bg-bg-primary`) to a coherent dark-shell system (slate-950 page, slate-900 cards, slate-800 inputs, one blue accent `#2563EB`, semantic emerald/amber/red status colors, subtle borders instead of hard shadows, `font-black`→`font-bold`); the white brutalist islands inside the dark cockpit (`AIAnalyticsPanel`) converted to dark surfaces. Employer light pages `employer/dashboard`, `employer/post-job`, `employer/company-claim` refined to the restrained brutalist system (Card/Button/Badge/Input/Select primitives, `shadow-brutal` tokens, `border-2`, one blue accent, `shadow-glow-btn` dead alias removed). Session report: `docs/session-reports/session-2026-08-20-frontend-redesign-agent-8.md`.
- AGENT 7 (Auth/Profile-Tools/Dashboard group): `frontend/src/app/login/page.tsx`, `frontend/src/app/signup/page.tsx`, `frontend/src/app/onboarding/page.tsx`, `frontend/src/app/profile/page.tsx` + `profile/[username]/page.tsx` (server wrappers, no visual surface — untouched), `frontend/src/components/profile/ProfileEditor.tsx`, `frontend/src/app/resume/page.tsx`, `frontend/src/app/applications/page.tsx`, `frontend/src/app/dashboard/page.tsx`. Session report: `docs/session-reports/session-2026-08-20-frontend-redesign-agent-7.md`. Follow-up flagged: `components/profile/PublicProfile.tsx` (canonical public profile UI, still on legacy tokens) + its shared `EditProfileModal.tsx`.
- AGENT 6 (News/Social group): `frontend/src/app/news/page.tsx`, `frontend/src/app/news/[slug]/page.tsx`, `frontend/src/app/feed/page.tsx`, `frontend/src/app/network/page.tsx`, `frontend/src/app/messages/page.tsx`, `frontend/src/app/notifications/page.tsx`, `frontend/src/app/community/[id]/page.tsx`, `frontend/src/components/ConnectionCard.tsx`, `frontend/src/components/MessageThread.tsx`, `frontend/src/components/shared/EmptyState.tsx` (raw CSS vars migrated to tokens), `frontend/src/components/ui/Card.tsx` (added `onClick` prop). Session report: `docs/session-reports/session-2026-08-20-frontend-redesign-agent-6.md`.. AGENT 4 done 2026-08-20: `opportunities/page.tsx` + `OpportunitiesClient.tsx` (glass-premium/btn-glow removed, primitives + shadow tokens, flat filter hierarchy), `opportunities/[slug]` (Card containers, Badge skills), `opportunities/location/[city]` (off the dark-cyber spec), `category/[category]` + `loading.tsx` (Card/Button, skeleton cleanup), `FilterBar` (font-bold, single blue accent, Card primitive), `SearchBar` (Input primitive).

## 7. Progress status

- 2026-08-20 — **Admin dark-shell + employer group DONE (AGENT 8):** all 11 admin routes (`page.tsx` cockpit, `analytics`, `add-opportunity`, `add-news`, `announcements`, `applications`, `companies`, `edit-opportunity/[id]`, `performance`, `scrape-health`, `talent-pool`), `admin/error.tsx`, and `admin/_components/AIAnalyticsPanel.tsx` migrated to a consistent dark-shell system: slate-950 page bg (shell-provided via `AppLayout`), slate-900 cards with `border-slate-800` subtle borders, slate-800 inputs with a single blue `#2563EB` focus ring, one blue accent (decorative purple/indigo accent misuse removed), semantic emerald/amber/red status colors preserved, `font-black`/`font-extrabold` → `font-bold`/`font-semibold`, `rounded-3xl`/raw `shadow-2xl`/colored glow shadows → `rounded-2xl` + small `shadow-sm`, dead `bg-cyan text-navy` (blue-on-off-white) buttons → `bg-blue-600 text-white`. All password gates (`/api/admin/auth`, `x-admin-password` for scrape-health), CRUD handlers, status flows, feature flags, and the AI-analytics fallback stats/logs preserved verbatim. Employer light pages (`employer/dashboard`, `employer/post-job`, `employer/company-claim`) refined to the restrained brutalist system: Card/Button/Badge/Input/Select primitives, `border-2` + `shadow-brutal` tokens, one blue accent, dead `shadow-glow-btn` alias removed, status actions on semantic emerald/red tints. `applications/page.tsx` was AGENT 7's file (already committed) — skipped per the collision rule. `tsc --noEmit` exit 0. Session report: `docs/session-reports/session-2026-08-20-frontend-redesign-agent-8.md`.
- 2026-08-20 — **Auth/Profile-Tools/Dashboard group DONE (AGENT 7):** `login`, `signup`, `onboarding`, `profile` (server wrappers), `components/profile/ProfileEditor.tsx`, `resume`, `applications`, `dashboard` migrated to the light brutalist system (primitives + token shadows, `border-2` only, one blue accent per view, semantic status colors: emerald=accepted, amber=in-review, red=rejected). All auth modes (email/password, username resolution, Google OAuth, magic-link fallback), signup 2-step role flow + username validation, onboarding submit, ProfileEditor skill PATCH, resume save/ATS/print, application withdraw, and dashboard status/bookmark/deadline handlers preserved verbatim. `tsc --noEmit` exit 0. Follow-up flagged: `components/profile/PublicProfile.tsx` + `EditProfileModal.tsx` (shared, legacy tokens, not in this agent's file list). Session report: `docs/session-reports/session-2026-08-20-frontend-redesign-agent-7.md`.
- 2026-08-20 — **Academy group DONE (AGENT 5):** `academy/page.tsx`, `academy/[track]/page.tsx`, `academy/[track]/day/[day]/page.tsx`, `academy/[track]/assessment/page.tsx`, `components/academy/PracticeQuiz.tsx`, `components/academy/YoutubeEmbed.tsx` migrated to the light brutalist system (primitives + token shadows, `border-2` only, semantic accent: blue primary / emerald completed / red wrong). Dark-era token patterns (`bg-bg-secondary` chips, `bg-surface`/`border-border`, amber gating CTA, background glow) removed. `academy/error.tsx` still dark-era — not assigned to this pass.