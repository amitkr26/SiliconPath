# E2E TEST STATUS — 2026-08-18 (FINAL: 9/9 GREEN on production, deploy 6d9684d)

## Suite
`frontend/tests/e2e/` — Playwright, chromium, workers=1, BASE_URL defaults to
https://berojgardegreewala.vercel.app (override with `$env:BASE_URL` for local runs).

- `header-nav.spec.ts` — header navigation (legacy)
- `network-connect.spec.ts` — network page connect (legacy)
- `accept-connection.spec.ts` — employer accepts (legacy)
- `messaging.spec.ts` — direct messaging (rewritten 2026-08-18: deterministic seed via
  `/messages?user=weqolyji`, then conversation list, then in-thread send)
- `social-workflow.spec.ts` — 2026-08-18: follow/unfollow persistence, connect →
  accept → connected (Message link), messaging A→B, feed post/like/comment counts

**Contract: run against a clean DB.** The suite creates real rows between test
accounts A (`xasefe9251@bejum.com` → `14738cfb-...`) and B (`weqolyji@forexzig.com`
→ `63eaf830-...`); leftover state from a previous run makes connect/feed tests fail
by design (see Cleanup below — run it before each full suite run).

## History (all runs against production unless noted)
- 2026-08-17: 5/5 legacy specs passed (38.4s).
- 2026-08-18 deploy `af3aa42`: run 1 → **5 passed / 4 failed** (follow/unfollow now
  works on production; failures were messaging username lookup, comment count span,
  legacy empty-state text, badge assertion).
- 2026-08-18 deploy `c6c91b0` (pair-connection queries, messages username lookup,
  comment count sync, e2e text fixes): run 2 → **5 passed / 4 failed**, different set
  (messaging `?user=` flow now green; remaining: comment-count span (count=2 —
  double-increment), connect badge assertion, legacy messaging/accept specs).
- 2026-08-18 deploy `cdc80a7`: **root cause of the count bug found**: the
  `on_post_like` trigger wrote a nonexistent `feed_posts.likes_count` column → every
  like INSERT failed at the DB level while the route returned `{ liked: true }`
  without checking (likes never persisted). Also both count triggers were
  RLS-filtered for plain-user inserts (SECURITY INVOKER + no cross-user UPDATE policy
  on feed_posts), so counts only worked via service-role inserts — and the route's
  manual increments double-counted on top of the trigger. Fix (migration
  `20260818000002_fix_post_count_triggers.sql`, applied live): trigger functions now
  write `like_count` and are SECURITY DEFINER; both routes stopped manual
  read-modify-write. Verified 8/8 trigger behaviors via direct PostgREST probes
  (comment/like/unlike/comment-delete, plain-user path).
- 2026-08-18 spec fixes (`86acb2f`): whitespace-tolerant comment-count assertion,
  Message-link assertion, connection-state wait, messaging list locator
  (`overflow-y-auto` — the list container uses `divide-y-2`, not `divide-y`).
  **Full suite: 9/9 passed (1.5m)** — see summary below.
- 2026-08-18 deploy `b07ebd1` (social counts + connection_count trigger): full suite
  8/9 — only `messaging.spec.ts` failed: on a CLEAN DB the conversation list showed
  "No conversations yet" right after the seed created a brand-new conversation.
- 2026-08-18 deploy `6d9684d` — **messaging flake root-caused and fixed.** A browser
  debug spec reproduced it deterministically: the first-ever conversation creation
  makes the immediate list GET return `200 {"conversations":[]}` for ~5-10s while the
  per-conversation GET already sees the row (read-after-write lag through the Supabase
  pooler). The conversations query now polls every 5s (`useConversations`
  `refetchInterval`, same pattern the messages query already used), so a fresh
  conversation appears without a manual reload. **Full suite: 9/9 passed (1.7m)** —
  see summary below. (The 8/9 run earlier the same day also exposed the cleanup
  contract: a leftover accepted connection from a prior run makes the connect test
  fail by design — always run the Cleanup SQL before each full suite run.)

## Final run — 9/9 PASSED (2026-08-18, deploy `6d9684d`, clean DB)
1. accept-connection (B sees received tab, empty state) ✓
2. header-nav guest ✓
3. header-nav candidate ✓
4. messaging: seed via ?user= → list shows conversation → in-thread send ✓
   (fresh-conversation path — the previously flaky case)
5. network-connect (no FK-error toast) ✓
6. social-workflow: follow → Following persists → unfollow → persists ✓
7. social-workflow: connect → Pending persists → B accepts → A sees Message link ✓
8. social-workflow: A messages B; B sees conversation + message ✓
9. social-workflow: feed post → B likes (1) → B comments via API → reload → count 1 ✓

## Cleanup after verification (run before each full suite run)
Delete rows between A (`14738cfb-9629-4d9b-a116-719b5a825afe`) and B
(`63eaf830-f7ba-42c0-8099-d3d3fd67b586`): user_follows, connections, feed_posts
(content LIKE 'E2E test post%'), notifications, messages, conversations
(participant_a/b). Executed via `db1-sql.mjs` Management API helper.