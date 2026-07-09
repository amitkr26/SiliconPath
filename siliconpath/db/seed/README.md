# Seed / Reference Inputs

These files are **reference inputs, not verified production data.** They are kept
here so the curation + scraper-onboarding work has a starting point, but nothing
here should be treated as live-ready until it passes verification.

## `trusted_sources.json`
Curated starting points for the VLSI Academy (courses, tutorials, YouTube channels,
free tools). **Before any of this becomes live Academy content**, each entry —
especially the YouTube videos/channels — must pass the per-item checklist in
`../../docs/ACADEMY_CURATION.md`: confirmed embeddable, a human confirmed it teaches
the stated topic, real creator attribution captured, and it's genuinely free (not a
teaser for a paid course). Reputation is a starting hypothesis, not proof.

## `../../docs/EXPANDED_SOURCE_LIST.md`
320+ candidate scraper sources (companies, labs, universities). Per the list's own
note: **verify each career-page URL individually, and roll out in batches of 20-30**,
verifying adapters work before the next batch. Do NOT wire all 320+ at once — a
university's research-position page is often not its general HR page, and many need
the schema.org JobPosting approach or manual handling.
