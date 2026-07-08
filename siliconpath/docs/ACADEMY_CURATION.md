# VLSI Academy — Content Curation Process (READ BEFORE SEEDING ANY VIDEO)

The Academy engine (schema, gating, embed, pages) is built. The **curriculum content
is intentionally empty** until each item passes this process. This is a direct
application of guardrail #3 (never fabricate confidence/knowledge) and #7 (content &
legal boundaries). Do NOT hardcode a "trusted channel" list or video IDs from memory.

## Why this file exists
A prior build produced a "domain knowledge" ranking of YouTube channels' teaching
quality WITHOUT verifying it — and its own later research proved that ranking wrong
(missed the largest channel in the space; missed a channel already running the exact
structured program being designed). We do not repeat that. Every video is verified
before it enters `academy_videos`.

## Per-video checklist (all required before insert)
1. **The video exists and is embeddable** — confirm the `youtube_id` loads via the
   official iframe and embedding is not disabled by the creator.
2. **Content actually matches the unit** — a human watched enough to confirm it
   teaches the day's stated topic at the right level (not assumed from the title).
3. **Creator attribution captured** — `creator_name` + `creator_url` are real and
   correct (these columns are NOT NULL; a video cannot be stored without them).
4. **License/business-model sanity** — confirm the specific video is free content,
   not a teaser for a paid course being embedded as if it were the lesson. (A prior
   evaluation nearly built a backbone around a creator whose flagship offerings were
   actually paid — discovered only by direct checking.)
5. **Record the audit trail** — set `verified_at` + `verified_by` on insert.

## Track structure (agreed; content pending)
1. Digital Logic Fundamentals
2. Verilog HDL
3. SystemVerilog for Verification
4. UVM
5. RTL Design & Synthesis
6. Physical Design & Backend
7. VLSI Interview Prep

## Sourcing guidance (starting points to VERIFY, not to trust blindly)
- Prefer sources with clear, verifiable track records (e.g. NPTEL / IIT-affiliated
  lecture series, well-established structured playlists). Verify current availability
  and teaching fit per the checklist — reputation is a starting hypothesis, not proof.
- Do not rank/choose channels by subscriber count alone.

## Pilot-first (per spec / guardrail #6)
Seed and fully verify **one** track (Digital Logic Fundamentals) end to end — units,
videos, checkpoint — and confirm the gating actually unlocks track 2 on a ≥ 70% pass,
BEFORE curating the remaining tracks.
