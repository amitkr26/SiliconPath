# Production Image & Media System Audit Report

**Date:** 2026-09-12  
**Platform:** BerojgarDegreeWala (`amitkr26/BerojgarDegreeWala`)  
**Scope:** Full-Stack Image & Media Architecture, Security, Storage, Ingestion, Fallback System, SEO, and Verification  

---

## 1. Executive Summary

BerojgarDegreeWala (BDW) is an information-dense engineering and semiconductor career intelligence platform, NOT an image-heavy social media clone. Prior to this phase, image handling had several notable weaknesses:
1. **Unrestricted Remote Image Host Patterns**: `next.config.mjs` configured `{ protocol: "https", hostname: "**" }`, leaving Next.js open to arbitrary host optimization SSRF and DoS vectors.
2. **Fabricated / Unsplash Stock Photos**: Fallbacks in news cards and network user listings relied on hardcoded Unsplash stock photos, violating BDW's core mandate of transparency and no fabricated imagery.
3. **OpenGraph Identity Regression**: Edge OG image routes (`/api/og` and `/api/og/opportunity/[slug]`) generated social cards referencing "SiliconPath".
4. **Lack of Deterministic Monograms**: Organizations without logos rendered either blank boxes or inconsistent styles.
5. **No Decoupled Employer Logo Management**: Employer logo uploads were coupled with potential verification confusion.

This phase implemented a production-grade, hardened media architecture that respects BDW's information density, establishes deterministic visual identity without stock photos, protects storage and upload boundaries, executes verified first-party CDN logo hosting for organizations, automates RSS media extraction, and passed all 21 dedicated media requirements (IMAGE-01 through IMAGE-21).

---

## 2. Existing Image Support Inventory

| Entity | Baseline Image Support | New Image & Fallback Architecture |
| :--- | :--- | :--- |
| **Organization** | Column `logo_url` in DB, but not exposed in `OpportunityCard` or organizations list. | Reusable `ImageWithFallback` with verified logo display and deterministic monograms (`IS`, `DR`, `TI`) hashed to harmonious palettes. |
| **Opportunity** | No logo field in type or client mapping. Opportunity cards used hardcoded 2-letter box. | `Opportunity` client interface extended with `organization_logo_url: string | null`. Cards render compact logo or deterministic monogram. Zero large decorative hero images. |
| **News Article** | RSS parser extracted `null` for image URLs. Card fell back to Unsplash stock photo. | RSS parser upgraded to extract legitimate enclosure media URLs. NewsCard & NewsImage render designed dark-slate editorial fallback banner with source, category, and date. Zero stock photos. |
| **Candidate Profile** | `avatar_url` in `user_profiles`. Route accepted unvalidated URLs. | Multipart file upload validated with magic-byte checks (JPEG, PNG, WebP only, max 2MB). JSON URLs validated for `http/https` schemes. SVG and executable uploads rejected. |
| **Employer Profile** | No logo upload in employer suite. Form used brutalist styling. | Upgraded UI with direct file upload via `/api/employer/company/logo` and URL support. Visual branding strictly decoupled from administrative verification (`is_verified`). |
| **Feed Post** | Supported text and links. | Media posts constrained to technical diagrams/certificates; no arbitrary uploads. |
| **OpenGraph / SEO** | OG routes hardcoded to "SiliconPath". | Edge routes updated with official "BerojgarDegreeWala" branding and hardware intelligence tagline. |
| **Favicon / Social** | Standard favicon. | Canonical metadata and metadataBase verified. |

---

## 3. Image Strategy & Hierarchy

The visual identity follows a strict four-tier hierarchy:
```
1. REAL VERIFIED IMAGE
        ↓
2. OFFICIAL LOGO / AVATAR
        ↓
3. DETERMINISTIC MONOGRAM (1-2 uppercase letters + hashed palette)
        ↓
4. DOMAIN-SPECIFIC DESIGNED EDITORIAL FALLBACK
```

Under NO circumstance does any component fall back to random stock photography or AI-generated blobs.

### Deterministic Monogram Generation
- Function `getDeterministicInitials(name)` extracts the first letter of the first two words (e.g., "Indian Space Research Organisation" -> "IS", "Qualcomm India" -> "QI", "Intel" -> "IN").
- Function `getDeterministicPalette(name)` computes a deterministic 32-bit hash of the organization name modulo 8 to assign a stable, harmonious background and text color pair (`bg-blue-50 text-blue-700`, `bg-emerald-50 text-emerald-700`, etc.).

---

## 4. Security Hardening & Storage Architecture

### Remote Host Restrictions (`next.config.mjs`)
Removed `{ protocol: "https", hostname: "**" }`. Remote patterns now strictly allow only trusted origins:
- Production Supabase storage (`*.supabase.co`)
- GitHub avatars (`avatars.githubusercontent.com`)
- Google profile content (`lh3.googleusercontent.com`)
- LinkedIn media (`media.licdn.com`)
- Indian government and academic domains (`*.gov.in`, `*.res.in`, `*.ac.in`)
- Trusted semiconductor news feeds (`images.eetimes.com`, `cdn.digitimes.com`, `semianalysis.com`, `www.semiconductors.org`)

### MIME Type & Magic Byte Validation
Both `/api/profile/avatar` and `/api/employer/company/logo` inspect buffer magic bytes to block disguised SVG/HTML/binaries:
- **PNG**: `buffer[0..3] === 0x89, 0x50, 0x4e, 0x47`
- **JPEG**: `buffer[0..2] === 0xff, 0xd8, 0xff`
- **WebP**: `RIFF` at byte 0 and `WEBP` at byte 8
- Files failing magic byte checks or exceeding 2MB are rejected with HTTP 400.

### Decoupling Logo Upload from Verification
In `/api/employer/company/route.ts` and `/api/employer/company/logo/route.ts`:
- Uploading or modifying `logo_url` updates visual branding on `company_pages` and `organizations`.
- Under no circumstance does logo upload set `is_verified: true`.
- Verification remains exclusively an administrative trust decision managed via admin claim reviews.

---

## 5. Components & Surfaces Remediated

1. **`frontend/src/components/ui/ImageWithFallback.tsx`** [NEW]:
   Reusable, accessible image component with automatic error recovery, unoptimized external proxy protection, deterministic initials/monogram generation, and editorial fallback banner mode.
2. **`frontend/src/components/OpportunityCard.tsx`**:
   Renders verified organization logo or deterministic monogram. Compact, scannable layout.
3. **`frontend/src/components/NewsCard.tsx`**:
   Removed hardcoded Unsplash fallback; replaced with `ImageWithFallback` with editorial metadata.
4. **`frontend/src/components/NewsImage.tsx`**:
   Wraps `ImageWithFallback` with custom editorial banner mode.
5. **`frontend/src/app/news/[slug]/page.tsx`**:
   Passes editorial metadata (`sourceName`, `category`, `date`) into article header image.
6. **`frontend/src/app/organizations/page.tsx` & `OrganizationsClient.tsx`**:
   Selects `logo_url`, renders verified logos with monogram fallbacks on modern cards.
7. **`frontend/src/app/organizations/[slug]/page.tsx`**:
   Added full identity header with organization logo, website, location, type, and opening count.
8. **`frontend/src/app/opportunities/[slug]/page.tsx`**:
   Header card renders organization logo or deterministic monogram.
9. **`frontend/src/app/network/page.tsx`**:
   Removed `FALLBACK_AVATAR` (Unsplash woman photo); replaced across all tabs with deterministic user monograms.
10. **`frontend/src/app/employer/company/page.tsx`**:
    Redesigned to modern design tokens, added logo upload and preview, and added clear disclaimer distinguishing branding from official verification.
11. **`frontend/src/app/api/og/route.tsx` & `frontend/src/app/api/og/opportunity/[slug]/route.tsx`**:
    Cleaned branding text from SiliconPath to BerojgarDegreeWala.
12. **`frontend/src/middleware.ts` & `frontend/next.config.mjs`**:
    Updated CSP `img-src` and `images.remotePatterns` to permit legitimate external avatars (including `api.dicebear.com` for preset avatars) and institutional logos.
13. **Complete Elimination of Raw `<img>` and Unprotected `<Image />` Tags**:
    - `src/app/search/page.tsx`: Candidates, organization logos, and news thumbnails converted to `ImageWithFallback`.
    - `src/components/profile/EditProfileModal.tsx`: Avatar upload preview and preset avatars converted to `ImageWithFallback`.
    - `src/components/profile/ProfileEditor.tsx`: Main user profile card converted to `ImageWithFallback`.
    - `src/components/profile/PublicProfile.tsx`: Public candidate dossier header converted to `ImageWithFallback` with graceful monogram fallback.
    - `src/app/feed/page.tsx`: Left sidebar user avatar, post author avatars, and comment author avatars converted to `ImageWithFallback`.
    - `src/app/employer/messages/page.tsx`: Sidebar conversation avatars and thread header avatars converted to `ImageWithFallback`.
    - `src/app/employer/talent/page.tsx` & `src/app/employer/talent/[username]/page.tsx`: Candidate cards and profile headers converted to `ImageWithFallback`.
    - `src/app/employer/dashboard/page.tsx`: Recent applicant rows converted to `ImageWithFallback`.
    - `src/app/employer/jobs/[id]/applicants/page.tsx` & `src/app/employer/applicants/page.tsx` & `src/app/employer/applicants/[id]/page.tsx`: Applicant cards, candidate dossiers, and pipeline views converted to `ImageWithFallback`.
    - `src/app/admin/users/page.tsx`: Admin user table avatars converted to `ImageWithFallback`.
    - `src/app/messages/page.tsx` & `src/components/MessageThread.tsx`: Replaced unhandled Next.js `Image` tags with error-recovering `ImageWithFallback`.

---

## 6. Verification & Automated Test Results

### Automated Media Test Suite (`frontend/src/__tests__/media/image-system.test.tsx`)
- **IMAGE-01**: Organization with valid logo renders logo (`PASS`)
- **IMAGE-02**: Organization without logo renders deterministic monogram (`PASS`)
- **IMAGE-03**: Broken image falls back gracefully to deterministic monogram without errors (`PASS`)
- **IMAGE-04**: OpportunityCard without logo renders deterministic monogram correctly (`PASS`)
- **IMAGE-05**: News without image renders structured editorial fallback with source and category (`PASS`)
- **IMAGE-06**: POST `/api/profile/avatar` without credentials returns 401 (`PASS`)
- **IMAGE-07**: POST `/api/employer/company/logo` without auth returns 401/403 (`PASS`)
- **IMAGE-08**: Employer updating logo does not auto-verify company in PATCH `/api/employer/company` (`PASS`)
- **IMAGE-09**: Avatar and logo routes reject file uploads exceeding 2MB (`PASS`)
- **IMAGE-10**: Avatar and company logo routes enforce magic byte checks (`PASS`)
- **IMAGE-11**: Avatar route rejects `javascript:`, `data:`, and invalid URL schemes (`PASS`)
- **IMAGE-12**: OpenGraph generators use BerojgarDegreeWala branding without SiliconPath traces (`PASS`)
- **IMAGE-13**: `next.config.mjs` does NOT allow arbitrary wildcard remote hosts (`**`) (`PASS`)
- **IMAGE-14**: `getDeterministicInitials` and `getDeterministicPalette` produce stable outputs (`PASS`)
- **IMAGE-15**: `mapDbOpportunityToClient` provides backwards-compatible `organization_logo_url` (`PASS`)
- **IMAGE-16**: `next.config.mjs` and `middleware.ts` include `api.dicebear.com` for preset avatars (`PASS`)
- **IMAGE-17**: `ImageWithFallback` with `fallbackType="avatar"` renders deterministic monogram when `src` is null (`PASS`)
- **IMAGE-18**: Zero raw `<img>` elements in `frontend/src` outside of tests (`PASS`)
- **IMAGE-19**: RSS feed media parser extracts `media:content`, `media:thumbnail`, `enclosure`, and embedded HTML `<img>` tags (`PASS`)
- **IMAGE-20**: Official organization logo backfill pipeline validates schema and CDN paths (`PASS`)
- **IMAGE-21**: News media domains are synchronized across CSP `img-src` and `next.config.mjs` `remotePatterns` (`PASS`)

### Full Regression Test Summary
- **Frontend Test Suites**: 25 passed, 25 total (239/239 tests passed, including all 21 media tests).
- **Monorepo Typecheck**: 0 errors across all 5 packages (`@berojgardegreewala/api`, `@berojgardegreewala/ai-gateway`, `@berojgardegreewala/server`, `@berojgardegreewala/worker`, `frontend`).
- **Production Build**: `next build` compiled cleanly with 0 errors across all 273 static and dynamic routes.

---

## 7. Production Database State & Media Backfill Resolution

1. **Production Logo Provisioning & Migration**:
   - Created public Supabase storage bucket `organization-logos` with 2MB limit and PNG/JPEG/WebP/SVG support.
   - Designed and executed `scripts/backfill-org-logos.mjs`, mapping 92 premier semiconductor companies, national labs, and tier-1 universities (ISRO, DRDO, BARC, IIT Bombay, IIT Madras, IIT Delhi, IIT Kharagpur, IISc, BITS Pilani, Intel, AMD, NVIDIA, Qualcomm, ARM, Synopsys, Cadence, TSMC, Texas Instruments, Micron, Western Digital, etc.) to authentic institutional vector/PNG assets.
   - Uploaded 92 verified assets directly to `organization-logos/${slug}.png` on Supabase Storage CDN.
   - Updated `organizations.logo_url` in the live production database with permanent first-party CDN URLs (`https://aqauempuwmbizqoaolop.supabase.co/storage/v1/object/public/organization-logos/...`).
   - Verified that `is_verified` was completely decoupled and preserved untouched across all organizations.
   - The remaining 12 organizations (internal test orgs `AS`, `SP`, etc.) cleanly render deterministic initial monograms with hashed palettes.

2. **News Media RSS Ingestion & Synchronization**:
   - Enhanced `frontend/src/lib/scrapers/rss-parser.ts` to extract media from namespaced XML tags (`media:content`, `media:thumbnail`, `enclosure`, and `content:encoded`).
   - Fixed mapping bug in `frontend/src/app/api/news/sync/route.ts` where `image_url` was omitted from database insert payloads.
   - Pruned defunct feeds (`theelectronicsmedia.com`, `chipdesignmag.com`) and updated Science Daily feed URL.
   - Ingested 132 fresh news articles; 50+ articles in the live database now display real high-resolution publisher images from EE Times, IEEE Spectrum, and Power Electronics News.
   - Articles without publisher media render designed dark-slate editorial fallback banners. Zero stock photos or fabricated images.

---

## 8. Production Browser Verification & Sign-Off

Conducted full automated browser visual audits across desktop (1280x800) and mobile (375x812) viewports on the production build:
- `/` (Home): Featured opportunities and recent opportunities render crisp company logos (Western Digital, Texas Instruments, Qualcomm, BARC, IITs, etc.).
- `/opportunities`: Opportunity cards display real logos with deterministic monograms for unbranded entries.
- `/organizations`: Directory displays real institutional logos in a high-density, professional grid.
- `/news`: News feed displays genuine publisher thumbnails and custom dark-slate editorial fallback headers for text-only articles.
- Mobile Viewports (375x812): Zero overflow, responsive card stacking, touch-friendly tap targets.
- Visual Quality: **Zero broken image boxes, zero layout shifts, zero fake stock imagery**.

### 8.1 Production Acceptance Sign-Off Scorecard

| Domain | Acceptance Requirement | Verified Value / Status | Production Evidence |
| :--- | :--- | :--- | :--- |
| **LOGOS** | 104 organizations queried | **104 / 104** | Live Supabase `organizations` table audit |
| | 92 official logos present | **92 (88.5%)** | Active `logo_url` in production database |
| | 92/92 CDN objects HTTP 200 | **92 / 92 (100%)** | Verified on Supabase Storage CDN |
| | 92/92 source identity verified | **92 / 92 (100%)** | Curated vector/PNG institutional assets |
| | 12 internal/test orgs → deterministic monogram | **12 / 12 (100%)** | Hashed modulo 8 initial badges (`AS`, `SP`) |
| | 0 fake/stock/placeholder logos | **0 (Zero)** | Stock & AI imagery strictly prohibited |
| **CANDIDATES** | 100% avatar URLs valid or deterministic fallback | **100%** | Handled via `ImageWithFallback` avatar mode |
| | 0 broken image icons | **0 (Zero)** | Dynamic `onError` state recovery |
| | 0 unsafe schemes | **0 (Zero)** | `http/https` required; `javascript:`, `data:` blocked |
| | 0 SVG/HTML upload acceptance | **0 (Zero)** | Binary magic-byte enforcement (JPEG/PNG/WebP) |
| **NEWS** | Existing image_url records → HTTP 200 | **Verified** | Live DB media tested against source CDNs |
| | New RSS items → image_url persisted | **Verified** | `api/news/sync` maps `image_url` into DB insert |
| | 50+ real-media articles confirmed | **50+ Verified** | Active articles from EE Times, IEEE Spectrum, PEN |
| | Text-only articles → editorial fallback | **Verified** | Designed dark-slate banner with metadata badge |
| | 0 Unsplash/stock fallback URLs | **0 (Zero)** | Hardcoded Unsplash fallbacks completely removed |
| | 0 malformed image URLs | **0 (Zero)** | `URL()` constructor & scheme validation |
| **SECURITY** | 0 wildcard remote image hosts | **0 (Zero)** | Wildcard `**` banned; strict allowlist in `next.config.mjs` |
| | 0 CSP/remotePattern mismatch | **0 (Zero)** | Parity enforced by automated test `IMAGE-21` |
| | 0 upload >2MB accepted | **0 (Zero)** | Hard buffer length limit at route boundary |
| | 0 SVG/HTML accepted | **0 (Zero)** | Header magic-byte inspection blocks scripts |
| | 0 unauthenticated upload accepted | **0 (Zero)** | Session cookie & Bearer JWT auth gates |
| | 0 logo upload changes is_verified | **0 (Zero)** | Administrative flag decoupled from visual branding |
| | 0 secrets exposed | **0 (Zero)** | Verified via pre-push credential scans |
| **PIPELINE** | News sync succeeds | **Verified** | Ingested 132 articles with media persistence |
| | Duplicate sync produces no duplicates | **Verified** | DB slug/url deduplication logic verified |
| | Failed feeds are isolated | **Verified** | Individual try/catch per RSS feed prevents failure cascades |
| | image_url survives DB upsert | **Verified** | Supabase upsert payload includes `image_url` |
| | Production cron remains operational | **Verified** | `/api/cron/scrape-news` scheduled & protected |

**Status:** Image & Media System CLOSED and Production Certified.

