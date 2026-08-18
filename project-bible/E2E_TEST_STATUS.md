# E2E TEST STATUS — 2026-08-18

## Suite
`frontend/tests/e2e/` — Playwright, chromium, workers=1, BASE_URL defaults to
https://berojgardegreewala.vercel.app (override with `$env:BASE_URL` for local runs).

- `header-nav.spec.ts` — header navigation (legacy)
- `network-connect.spec.ts` — network page connect (legacy)
- `accept-connection.spec.ts` — employer accepts (legacy)
- `messaging.spec.ts` — direct messaging (legacy)
- `social-workflow.spec.ts` — NEW 2026-08-18: follow/unfollow persistence, connect →
  accept → connected, messaging A→B, feed post/like/comment

## History
- 2026-08-17: 5/5 legacy specs passed against production (38.4s).
- 2026-08-18 local (localhost:3000): logins fail on first click due to React
  hydration race → helper now retries (re-fill + re-click). Social flows then blocked
  by stale service-role key (admin routes 401 locally) → local run deferred until key
  fixed (KNOWN_ISSUES #1). `/people` crash found+fixed via local run.
- 2026-08-18 production run: **PENDING** — awaiting deploy (05a5494).

## Pending verification checklist (production, after deploy)
1. A → /people/weqolyji → Follow → Following; reload persists; unfollow → Follow; reload persists
2. A → Connect → Pending; reload persists; B accepts on /network; A sees Connected
3. A → /messages?user=weqolyji → send → bubble; B sees message
4. A posts to /feed; B likes (count 1) + comments via API (count 1); reload persists
5. Browser console: no GoTrueClient warning on /messages or /academy
6. DB spot-check: user_follows / connections rows present; counts match

## Cleanup after verification
Delete rows between A (14738cfb-9629-4d9b-a116-719b5a825afe) and B
(63eaf830-f7ba-42c0-8099-d3d3fd67b586): user_follows, connections, feed_posts
(content LIKE 'E2E%'), conversations (participant_a/b), notifications.