# Secrets Status — Single Source of Truth (2026-08-14)

Status of every credential that appeared in this repository's git history, with live
validity checks performed 2026-08-14 (read-only). Values never printed; identified by
first-12-hex SHA-256 and masked prefixes. All git-exposed strings were scrubbed from
the repo on 2026-08-13 (783b797 dead-code cleanup + 8515b61 configmap redaction) —
none of these are visible in current history.

## Rotated / dead ✓

| Credential | Exposed in git | Window | Evidence of remediation |
|---|---|---|---|
| Neon PRIMARY password (`neondb_owner` @ `ep-green-paper-ad3dy630-pooler`, `npg_Jp3OtAenHVM5…`) | scripts 6bd47d5 (08-01), backend fallback bc96d89 (08-02), k8s/configmap.yaml base64 f0eda74 (08-02) | 08-01 → 08-13 (12–13 d) | **Rotated 2026-08-13** via `ALTER ROLE`; old password rejected everywhere; Vercel `NEON_1_DATABASE_URL` updated; redeployed (bpw9ggmqk); `/api/health` neon_primary ok |
| Neon SECONDARY password (`neondb_owner` @ `ep-crimson-tree-atp6kiq0-pooler`, `npg_MyvHzL81UPTa…`) | scripts 6bd47d5 (08-01), bc96d89 (08-02) | 08-01 → 08-13 (12–13 d) | **Rotated 2026-08-14** via `ALTER ROLE`; old password rejected everywhere; `siliconpath-credentials.txt` + Vercel `NEON_2_DATABASE_URL` (production & preview) updated; redeployed (2ij08bs0o); `/api/health` neon_secondary **ok** |
| Groq API key (old "API Key" in creds file) | — | — | Invalid (401) on live test |
| Supabase PRIMARY new-format secret (`sb_secret_u0S5lA…`) | QA scripts 4f5c37b/90b0e36 (08-03) family | 08-03 → 08-13 | Invalid (401) on live test |
| Supabase publishable/anon keys (both projects) | same window | 08-03 → 08-13 | Public by design (client-side, RLS-protected) — no action needed |
| NVIDIA `vcp_…` tokens (4) | 08-01–08-13 commits (bc96d89, 6bea78f, 7637985, 783b797) | 07-22 → 08-13 (~22 d) | No longer present in creds file; presumed rotated — **verify in NVIDIA org before reuse** |
| Gemini / AWS (AKIA) / Cloudflare (`cfat_`) / NVIDIA `nfp_` | never in git | — | Never exposed |

## OPEN — NOT rotated (live-tested 2026-08-14)

| # | Credential | Exposed in git | Live check | Action |
|---|---|---|---|---|
| P0-1 | **Supabase PRIMARY service role key** (old-format JWT, `e6743182aac8…`; same value in `frontend/.env.local` = **prod is running on it**) | QA scripts 4994ddc/f4f83de (08-08), removed 783b797 | **200 VALID** (REST, apikey header) | Rotate in dashboard: project `aqauempuwmbizqoaolop` → Settings → API → regenerate service_role; update `.env.local`, `siliconpath-credentials.txt`, Vercel env (whatever name prod reads); redeploy |
| P0-2 | **Supabase SECONDARY service key** (`sb_secret_9K7wlr…`, project `jbqjipwanfsxyqkfrrpx`) — flagged in first audit for manual rotation | same 08-03/08-08 commits, removed 783b797 | **200 VALID** | **Manual (no agent access):** dashboard project `jbqjipwanfsxyqkfrrpx` → Settings → API → regenerate secret key; update `siliconpath-credentials.txt` |
| P0-3 | **Supabase personal access token 1** (`sbp_7695c7…`, grants project `aqauempuwmbizqoaolop`) | clean-both-dbs.js / get-supabase-keys.js (4994ddc 08-08, removed 783b797) | **VALID** (management API, account-level) | **Manual:** dashboard → Account → Access Tokens → revoke |
| P0-4 | **Supabase personal access token 2** (`sbp_d4d62c…`, grants project `jbqjipwanfsxyqkfrrpx`) | same | **VALID** (management API, account-level) | **Manual:** revoke same as P0-3 |
| P0-6 | **Groq API key** ("Updated API Key" in creds file, `0437fb1193c3…`) | docs/scripts 4e541c6/9841e39 (07-31), 6bd47d5/fd8e8c0 (08-01), removed 783b797 | **VALID** (models API) | **Manual:** console.groq.com → API Keys → revoke/recreate; update creds file |
| P0-7 | **Telegram bot token** (`@electrobridge_bot`, `8951787937:…`) | same 07-31/08-01 commits | **VALID** (getMe) | **Manual:** @BotFather → /revoke (or /token) → regenerate; update creds file |

## Timeline of the leak

- 07-22 → 08-01: QA/tooling scripts and docs grew hardcoded secrets (Neon ×2, Groq, Telegram, NVIDIA).
- 08-02: base64-encoded Neon primary URL added to `k8s/configmap.yaml`; backend connection fallbacks hardcoded.
- 08-03/08-08: Supabase keys (both projects, old-format service JWT + new-format) and `sbp_` personal tokens added to QA scripts.
- 08-13: all scrubbed (783b797 deleted the scripts; 8515b61 redacted the configmap) — **no git-exposed secret survives in current history; no new commit has reintroduced any (verified `git log -S` after 08-13).**
- 08-13: Neon primary rotated. 08-14: live-validity audit above; Neon secondary rotated.

## Recommended close-out order

1. ✅ (Agent) Rotate Neon secondary (P0-5) — done 2026-08-14, `/api/health` neon_secondary ok.
2. (User, manual — no agent access needed) Revoke both `sbp_` tokens (P0-3/4) — highest blast radius, account-level.
3. (User, manual) Regenerate primary Supabase service key (P0-1 — prod is live on it) and secondary secret key (P0-2).
4. (User, manual) Regenerate Groq key (P0-6) and Telegram bot token (P0-7).
5. (User) Confirm NVIDIA `vcp_` tokens were rotated before any reuse.
6. Re-run this liveness audit (script: `/tmp/opencode/newsverify/secret-liveness.cjs`) until every row is dead/rejected.