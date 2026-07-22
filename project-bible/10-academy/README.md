# BerojgarDegreeWala Academy

## Overview

A completely free VLSI, Electronics, and Semiconductor learning platform with 7 sequential tracks, day-wise content, practice quizzes, and gated assessments.

## Curriculum Tracks

| # | Track | Prerequisites | Days | Hours |
|---|-------|--------------|------|-------|
| 1 | Digital Logic Fundamentals | None | 14 | 28 |
| 2 | Verilog HDL | Track 1 | 21 | 42 |
| 3 | SystemVerilog for Verification | Track 2 | 21 | 45 |
| 4 | UVM (Universal Verification Methodology) | Track 3 | 28 | 56 |
| 5 | RTL Design & Synthesis | Track 2 | 21 | 40 |
| 6 | Physical Design & Backend | Track 5 | 28 | 50 |
| 7 | VLSI Interview Preparation | Track 5 | 14 | 30 |

## Architecture

### Data Sources
1. **Supabase tables**: `academy_tracks`, `academy_days`, `track_checkpoints`, `user_learning_progress`
2. **Fallback hardcoded data**: `FALLBACK_TRACKS` in `src/lib/academy/queries.ts` — shown when DB is unavailable

### Dual Table Names
The code tries `academy_tracks` first, falls back to `learning_tracks` (legacy table name). This accommodates both migration generations.

### User Progress
- Progress is stored in `user_learning_progress` table
- Day completion: `status = 'completed'` with `day_number`
- Assessment completion: `status = 'completed'` with `day_number = 999` and `checkpoint_score`

## Assessment Gating

Each track has a gating assessment accessible only when:
1. All days in the track are marked complete
2. The user has a passing score (≥80%) on the assessment

The flow is:
```
All days complete → "Take Assessment" button appears
  → Assessment page checks all days completed (guard)
  → User answers 15-20 MCQ questions
  → Score ≥ 80% → Track marked as passed → Next track unlocks
  → Score < 80% → Retry allowed (unlimited)
```

## Fallback System

The academy module has multi-layered fallbacks:
1. Environment check → if Supabase not configured, return `FALLBACK_TRACKS`
2. Table check → try `academy_tracks`, fallback to `learning_tracks`
3. Error handling → any exception returns `FALLBACK_TRACKS`
4. Page timeout → 8-second timeout on landing page forces `FALLBACK_TRACKS`

## Known Limitations

- Assessment retry is unlimited (no cooldown or attempt limit)
- No dedicated `academy_assessment_results` table — scores stored in `user_learning_progress` with magic `day_number=999`
- Passing score is hardcoded at 80% (could be read from `track_checkpoints.passing_score`)
- Certificate generation not yet implemented

## Related Documents

- [curriculum.md](./curriculum.md) — Detailed track content
- [assessments.md](./assessments.md) — Assessment system
- [progress-tracking.md](./progress-tracking.md) — User progress
