# Tier 2 Social + Company Claim + Employer Posting (notes)

## What this implements
- **Connections**: request / accept / decline, RLS-scoped to participants.
- **Messaging**: 1:1 threads, RLS so only sender/recipient can read.
- **Companies directory**: auto-generated from `companies` (populated by scraping),
  with a **claim-this-page** flow (work-email domain must match company domain).
- **Employer job posting**: feeds the SAME `opportunities` table tagged
  `source_type = 'employer_posted'` — one unified listing (spec §5, §3 Tier 2).
- **Feed**: curated from opportunities + news, NOT a blank UGC status wall (spec §8).

## Follow-ups NOT done here (flagged, not faked)
1. **Employer-posting authorization**: `postEmployerJob` currently inserts via the
   user's RLS client. Before enabling in prod, add an INSERT policy on
   `opportunities` that allows `employer_posted` rows ONLY from a user with a
   `verified` `company_claims` row for that company. Written up, not implemented,
   because it needs the live RLS environment to test safely.
2. **Company-claim email verification**: we do the structural domain match now; the
   send-and-confirm email step is a follow-up (needs the Resend/email integration).
3. **Endorsements / recommendations**: deferred; additive tables over this schema.
4. **Realtime messaging**: currently request/refresh; Supabase Realtime can layer on.

## NOT VERIFIED (guardrail #1)
No build / DB apply / RLS round-trip run. In particular, verify with two accounts
that: connections and messages are invisible to non-participants; the domain-mismatch
claim path is actually rejected; and employer postings appear in /opportunities.
