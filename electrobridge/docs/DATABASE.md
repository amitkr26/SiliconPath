# SiliconPath Database Schema

This document details the database schema, tables, and relationships configured for SiliconPath.

## Core Content Database (db1 - Supabase Primary)

These tables are managed in Supabase Primary (`aqauempuwmbizqoaolop`).

### 1. `learning_tracks`
Stores the high-level educational tracks.
- `id` (uuid, PRIMARY KEY): Unique identifier.
- `name` (text, NOT NULL): Name of the track.
- `order_index` (integer, NOT NULL, UNIQUE): Progression order.
- `unlock_condition` (text): Prerequisite descriptions.
- `description` (text): Explanation of the track syllabus.

### 2. `learning_days`
Stores day-wise curriculum items for each track.
- `id` (uuid, PRIMARY KEY): Unique identifier.
- `track_id` (uuid, REFERENCES `learning_tracks(id)`): Parent track.
- `day_number` (integer, NOT NULL): Position in the track (e.g. Day 1, Day 2).
- `title` (text, NOT NULL): Lesson title.
- `theory_ref` (text): Reference links.
- `theory_summary` (text): Comprehensive markdown theory text.
- `video_ref` (text): YouTube video ID.
- `video_start_ts` (integer): Deep-link start timestamp in seconds.
- `video_end_ts` (integer): Deep-link end timestamp in seconds.
- `practice_ref` (text): External practice check/lab link.
- `coding_task` (text): Coding lab challenge.
- `interview_qs` (jsonb): Array of `{question, answer}` objects.
- *Constraint*: `UNIQUE(track_id, day_number)`

### 3. `resource_bank`
Stores candidate and verified educational resources.
- `id` (uuid, PRIMARY KEY): Unique identifier.
- `topic_tag` (text): Tag labels (e.g. RTL, Verilog).
- `resource_type` (text): `video`, `playlist`, or `article`.
- `url` (text, UNIQUE): URL link to resource.
- `channel_name` (text): Mandatory author/channel attribution.
- `channel_url` (text): Mandatory channel watch/landing page.
- `quality_score` (numeric): Rolling score based on AI rank & user thumbs feedback.
- `difficulty_level` (text): `beginner`, `intermediate`, or `advanced`.
- `status` (text): `unverified`, `verified`, or `flagged`.
- `last_checked_at` (timestamptz): Heartbeat validation timestamp.

### 4. `track_checkpoints`
Stores end-of-track gating check assets.
- `id` (uuid, PRIMARY KEY): Unique identifier.
- `track_id` (uuid, UNIQUE, REFERENCES `learning_tracks(id)`): Track parent.
- `assessment_questions_ref` (jsonb): List of MCQ question objects.
- `capstone_brief` (text): Final project prompt instructions.

### 5. `user_learning_progress`
Tracks user completion and scores.
- `user_id` (uuid, REFERENCES `auth.users(id)`): Student account.
- `track_id` (uuid, REFERENCES `learning_tracks(id)`): Active track.
- `day_number` (integer): Completed day.
- `status` (text): `in_progress` or `completed`.
- `checkpoint_score` (integer): Day-end checkpoint grade.
- `capstone_submitted_at` (timestamptz): Capstone project upload time.
- *Constraint*: `PRIMARY KEY (user_id, track_id, day_number)`
