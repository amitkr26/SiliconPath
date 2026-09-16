# SiliconPath Frontend

Next.js 14 (App Router) frontend for **SiliconPath** — a 100% free VLSI learning platform (academy, learning paths, video course library, engineering lab, STA Q&A, career guides).

## Quick Links
- **Root README**: [../README.md](../README.md)
- **Architecture Documentation**: [../project-bible/ARCHITECTURE.md](../project-bible/ARCHITECTURE.md)
- **Live Site**: [https://siliconpath.in](https://siliconpath.in)

## Local Development Setup

```bash
# Install dependencies (from repo root)
npm install

# Start development server
npm run dev --workspace=frontend

# Build production bundle
npm run build --workspace=frontend

# Start production server
npm run start --workspace=frontend
```

## Verification Gates

```bash
cd frontend
npx tsc --noEmit   # typecheck
npm test           # jest suite (curriculum/integrity/sitemap/video-references/academy mapping)
npm run build      # production build
```

## Data Notes

- `src/lib/video-references.ts` is the single source of truth for all NPTEL + YouTube course references (used by `/learn/video-courses`, `/learn/[path]` companion cards, and embedded videos on `/academy/[track]`).
- Academy content lives in Supabase (`learning_tracks`, `learning_days`) with client-side fallbacks in `src/lib/academy/fallback.ts` and localStorage progress tracking.

For full environment variable configuration and system architecture details, refer to the [Root README](../README.md) and [project-bible/DEVELOPMENT.md](../project-bible/DEVELOPMENT.md).