import { test, assert, testApp, withServer } from "./helpers.js";
import { slugify } from "@berojgardegreewala/api/src/content/news-sync";

const AUTH = { Authorization: "Bearer good-token" };

test("parity: new protected endpoints reject missing tokens with 401", async () => {
  const app = testApp();
  await withServer(app, async (base) => {
    for (const path of [
      "/api/v1/feed",
      "/api/v1/feed/posts/x/like",
      "/api/v1/network/connect",
      "/api/v1/network/connections",
      "/api/v1/network/suggestions",
      "/api/v1/notifications",
      "/api/v1/notifications/count",
      "/api/v1/messages",
      "/api/v1/messages/with/u2",
    ]) {
      const res = await fetch(`${base}${path}`);
      assert.equal(res.status, 401, path);
      assert.equal((await res.json()).error.code, "UNAUTHORIZED", path);
    }
  });
});

test("parity: ai chat returns no-match fallback when nothing is grounded", async () => {
  const app = testApp();
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/ai/chat`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "find me a job" }] }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.grounded, false);
    assert.equal(body.data.matches, 0);
    assert.match(body.data.text, /could not find/i);
  });
});

test("parity: ai match with an empty pool returns empty matches", async () => {
  const app = testApp();
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/ai/match`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { skills: ["vlsi"] } }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.data.matches, []);
    assert.equal(body.data.candidates, 0);
  });
});

test("parity: ai search rejects a missing query", async () => {
  const app = testApp();
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/ai/search`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ query: "  " }),
    });
    assert.equal(res.status, 400);
  });
});

test("parity: ai summarize rejects missing text", async () => {
  const app = testApp();
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/ai/summarize`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
  });
});

test("parity: signup validates email and creates the user", async () => {
  const app = testApp();
  await withServer(app, async (base) => {
    const bad = await fetch(`${base}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nope", password: "password123", username: "amit", accountType: "candidate" }),
    });
    assert.equal(bad.status, 400);

    const good = await fetch(`${base}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", password: "password123", username: "amitk", accountType: "candidate" }),
    });
    assert.equal(good.status, 201);
    assert.equal((await good.json()).data.user.email, "a@b.com");
  });
});

test("parity: signup conflicts on a taken username", async () => {
  const app = testApp({ user_profiles: [{ id: "u1", username: "amitk" }] });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", password: "password123", username: "amitk", accountType: "candidate" }),
    });
    assert.equal(res.status, 409);
  });
});

test("parity: check-username reports availability and suggestions", async () => {
  const app = testApp({ user_profiles: [{ id: "u1", username: "amitk" }] });
  await withServer(app, async (base) => {
    const free = await fetch(`${base}/api/v1/auth/check-username?username=brand_new_name`);
    assert.equal((await free.json()).data.available, true);

    const taken = await fetch(`${base}/api/v1/auth/check-username?username=amitk`);
    const body = await taken.json();
    assert.equal(body.data.available, false);
    assert.ok(body.data.suggestions.length > 0);
  });
});

test("parity: search returns empty payloads for an empty query", async () => {
  const app = testApp();
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/search?q=`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.data.opportunities, []);
    assert.deepEqual(body.data.people, []);
  });
});

test("parity: search finds opportunities and people", async () => {
  const app = testApp({
    opportunities: [{ id: "o1", title: "DRDO JRF", slug: "drdo-jrf", category: "jrf", location: "Delhi", deadline: null, apply_url: "https://x.com", organizations: null }],
    user_profiles: [
      { id: "p1", username: "amitk", display_name: "Amit Kumar", headline: "VLSI Engineer", current_company: "X", location: "Delhi", skills: ["vlsi"], is_profile_public: true, connection_count: 3 },
    ],
  });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/search?q=jrf`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.opportunities.length, 1);
    assert.equal(body.data.people.length, 1);
  });
});

test("parity: news slug route returns 404 and resolves existing slugs", async () => {
  // NOTE: the fake client does not filter by .eq() — it returns the canned
  // rows, so "missing" is simulated with an empty table.
  const empty = testApp({ news_archive: [] });
  await withServer(empty, async (base) => {
    const missing = await fetch(`${base}/api/v1/news/nope`);
    assert.equal(missing.status, 404);
  });

  const app = testApp({ news_archive: [{ slug: "chip-news", title: "Chip News", summary: "s", source_name: "IEEE", url: "https://x.com", published_at: "2026-01-01T00:00:00Z", image_url: null, tags: ["chip"] }] });
  await withServer(app, async (base) => {
    const found = await fetch(`${base}/api/v1/news/chip-news`);
    assert.equal(found.status, 200);
    assert.equal((await found.json()).data.title, "Chip News");
  });
});

test("parity: cron news-sync rejects a missing or wrong secret", async () => {
  const app = testApp();
  await withServer(app, async (base) => {
    const none = await fetch(`${base}/api/v1/cron/news-sync`);
    assert.equal(none.status, 403);
    const wrong = await fetch(`${base}/api/v1/cron/news-sync`, { headers: { Authorization: "Bearer wrong" } });
    assert.equal(wrong.status, 403);
  });
});

test("parity: slugify is deterministic and length-capped", () => {
  assert.equal(slugify("Hello, World! 2024"), "hello-world-2024");
  // Non-slug input falls back to a timestamped id (same as the frontend).
  assert.match(slugify("   "), /^rss-\d+$/);
  assert.ok(slugify("x".repeat(120)).length <= 80);
});

test("parity: search rate limit kicks in past the preset window", async () => {
  const app = testApp();
  await withServer(app, async (base) => {
    let lastStatus = 0;
    for (let i = 0; i < 40; i++) {
      const res = await fetch(`${base}/api/v1/search?q=loop${i}`);
      lastStatus = res.status;
      if (res.status === 429) break;
    }
    assert.equal(lastStatus, 429);
  });
});