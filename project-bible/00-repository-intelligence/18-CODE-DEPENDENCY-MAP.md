# 18-CODE-DEPENDENCY-MAP — Dependency Graph & Shared Libraries

- **Shared Client**: `frontend/src/lib/supabase.ts` (Universal Supabase entrypoint).
- **Auth Guard**: `frontend/src/lib/employer-auth.ts` (Used across all 15 `/api/employer/*` routes).
- **Scoring Engine**: `frontend/src/lib/profile-completeness.ts` (Shared between Candidate Profile and Employer Talent Discovery).
- **TypeScript Schemas**: `frontend/src/types/index.ts` (Authoritative source for all frontend interfaces).
