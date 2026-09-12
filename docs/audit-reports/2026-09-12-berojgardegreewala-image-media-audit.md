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

This phase implemented a production-grade, hardened media architecture that respects BDW's information density, establishes deterministic visual identity without stock photos, protects storage and upload boundaries, and passed all 15 dedicated media requirements (IMAGE-01 through IMAGE-15).

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
12. **`frontend/src/middleware.ts`**:
    Updated CSP `img-src` to permit legitimate external avatars and institutional logos.

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

### Full Regression Test Summary
- **Frontend Test Suites**: 25 passed, 25 total (233/233 tests passed).
- **Monorepo Typecheck**: 0 errors across all 5 packages (`@berojgardegreewala/api`, `@berojgardegreewala/ai-gateway`, `@berojgardegreewala/server`, `@berojgardegreewala/worker`, `frontend`).
- **Production Build**: `next build` compiled cleanly with 0 errors across 273 static and dynamic routes.

---

## 7. Known Limitations & Next Steps

1. **Storage Buckets**: In local development environments without an active Supabase storage bucket `organization-logos`, the API automatically falls back to `avatars` or logs a descriptive warning without crashing.
2. **Third-Party RSS Feeds**: Certain syndicated RSS feeds do not provide `media:content` or `enclosure` tags in their XML payload; for these items, the platform intentionally renders the high-contrast editorial fallback rather than attempting unauthorized web scraping of third-party article pages.
