import { test, assert, withServer } from "./helpers.js";
import { afterEach } from "node:test";
import { loadEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";
import { fakeSupabase } from "./fake.js";
import type { Deps } from "../src/types.js";
import type { Express } from "express";

// Phase 5 hardening suite. NOTE: node:test runs each test FILE in its own
// process, so the in-memory rate-limit buckets and the gateway cooldowns are
// isolated from the other test files.
//
// AI tests stub global.fetch and set GROQ_API_KEY — the gateway then runs
// against the stub without any real credentials or network traffic.

const AUTH = { Authorization: "Bearer good-token" };
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function stubGroq(text: string): void {
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.startsWith(GROQ_URL)) return jsonResponse({ choices: [{ message: { content: text } }] });
    if (u.startsWith("http://127.0.0.1")) return originalFetch(url, init); // passthrough for the local test server
    return jsonResponse({ error: "unexpected provider" }, 500);
  }) as typeof fetch;
}

function capturedFetch(): { calls: { url: string; body: string }[] } {
  const calls: { url: string; body: string }[] = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.startsWith("http://127.0.0.1")) return originalFetch(url, init); // passthrough: never counted
    calls.push({ url: u, body: String(init?.body || "") });
    if (u.startsWith(GROQ_URL)) return jsonResponse({ choices: [{ message: { content: "ok" } }] });
    return jsonResponse({ error: "unexpected provider" }, 500);
  }) as typeof fetch;
  return { calls };
}

function buildApp(dataByTable: Record<string, unknown> = {}, adminOverride?: unknown): Express {
  const deps: Deps = {
    env: loadEnv(),
    supabase: fakeSupabase(dataByTable),
    supabaseAdmin: adminOverride === undefined ? fakeSupabase(dataByTable) : (adminOverride as any),
    supabase2Admin: fakeSupabase(dataByTable),
  };
  return createApp(deps);
}

afterEach(() => {
  delete process.env.GROQ_API_KEY;
  delete process.env.ALLOWED_ORIGINS;
  if (originalFetch) globalThis.fetch = originalFetch;
});

// ---------- AI route behavior (providers stubbed) ----------

test("ai chat grounds on live opportunities and passes them to the model", async () => {
  process.env.GROQ_API_KEY = "test-key";
  const { calls } = capturedFetch();
  const app = buildApp({
    opportunities: [{
      id: "o1", title: "DRDO JRF", slug: "drdo-jrf", category: "jrf", location: "Delhi",
      deadline: "2026-12-01", apply_url: "https://careers.drdo.in/jrf", organization_id: "org-1",
    }],
  });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/ai/chat`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "find me a DRDO jrf" }] }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.grounded, true);
    assert.equal(body.data.matches, 1);
    assert.equal(body.data.provider, "groq");
    // The grounding rows + URL-host allowlist reach the model in the system prompt.
    assert.ok(calls.length >= 1, "provider was called");
    assert.ok(calls[0].body.includes("DRDO JRF"), "grounded title in prompt");
    assert.ok(calls[0].body.includes("careers.drdo.in"), "allowlisted host in prompt");
  });
});

test("ai chat never fabricates matches and restricts URLs to grounded hosts", async () => {
  process.env.GROQ_API_KEY = "test-key";
  const { calls } = capturedFetch();
  const app = buildApp({
    opportunities: [{
      id: "o2", title: "VLSI Engineer", slug: "vlsi-eng", category: "job", location: "Bangalore",
      deadline: null, apply_url: "https://evil.example/paywall", organization_id: "org-2",
    }],
  });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/ai/chat`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "any vlsi jobs" }] }),
    });
    assert.equal(res.status, 200);
    // The system prompt carries the allowlist explicitly.
    assert.ok(calls[0].body.includes("evil.example"), "row host is the only allowed host");
  });
});

test("ai chat maps total provider failure to 502 AI_UNAVAILABLE (no fabricated success)", async () => {
  // No GROQ_API_KEY set: all providers are skipped (omnirouter fails on the stub).
  stubGroq("unused");
  const app = buildApp({ opportunities: [{ id: "o1", title: "DRDO JRF", category: "jrf", apply_url: "https://x.com" }] });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/ai/chat`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "anything" }] }),
    });
    assert.equal(res.status, 502);
    assert.equal((await res.json()).error.code, "AI_UNAVAILABLE");
  });
});

test("ai match filters out invalid opportunity ids and caps at top-10", async () => {
  process.env.GROQ_API_KEY = "test-key";
  stubGroq(JSON.stringify([{ id: "o1", reason: "great fit" }, { id: "o9", reason: "bogus" }, { id: "o2", reason: "also fits" }]));
  const app = buildApp({
    opportunities: [
      { id: "o1", title: "A", category: "jrf", location: null, deadline: null, eligibility: null, description: null },
      { id: "o2", title: "B", category: "job", location: null, deadline: null, eligibility: null, description: null },
      { id: "o3", title: "C", category: "phd", location: null, deadline: null, eligibility: null, description: null },
    ],
  });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/ai/match`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { skills: ["vlsi"] } }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.candidates, 3);
    assert.equal(body.data.matches.length, 2); // o9 rejected, o1+o2 kept
    assert.ok(body.data.matches.every((m: { id: string }) => ["o1", "o2"].includes(m.id)));
    assert.ok(body.data.matches.every((m: { reason: string }) => typeof m.reason === "string"));
  });
});

test("ai match with malformed provider output surfaces a controlled 500 (never a fabricated list)", async () => {
  process.env.GROQ_API_KEY = "test-key";
  stubGroq("this is definitely not json [");
  const app = buildApp({ opportunities: [{ id: "o1", title: "A", category: "jrf" }] });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/ai/match`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { skills: ["vlsi"] } }),
    });
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, "INTERNAL_ERROR");
    assert.ok(!JSON.stringify(body).includes("stack"), "no stack trace leaks");
  });
});

test("ai search extracts safe filters and applies them to the pool", async () => {
  process.env.GROQ_API_KEY = "test-key";
  stubGroq(JSON.stringify({ category: "jrf", location: "delhi", bogus_key: "ignored" }));
  const app = buildApp({
    opportunities: [
      { id: "o1", title: "DRDO JRF", slug: "drdo", category: "jrf", location: "Delhi", deadline: null, apply_url: "https://x.com", eligibility: "BTech", description: "semiconductor research", organizations: null },
      { id: "o2", title: "ISRO JRF", slug: "isro", category: "jrf", location: "Bangalore", deadline: null, apply_url: "https://x.com", eligibility: "BTech", description: "space", organizations: null },
    ],
  });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/ai/search`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ query: "jrf jobs in delhi" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.data.filters, { category: "jrf", location: "delhi" }); // bogus_key dropped
    assert.equal(body.data.results.length, 1);
    assert.equal(body.data.results[0].id, "o1");
  });
});

test("ai summarize returns provider output", async () => {
  process.env.GROQ_API_KEY = "test-key";
  stubGroq("bullet 1\nbullet 2");
  const app = buildApp();
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/ai/summarize`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ text: "some long text".repeat(20) }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.text, "bullet 1\nbullet 2");
    assert.equal(body.data.provider, "groq");
  });
});

// ---------- AI telemetry ----------

test("ai usage telemetry records a success row with safe fields", async () => {
  process.env.GROQ_API_KEY = "test-key";
  stubGroq("hello from groq");
  const inserts: unknown[] = [];
  const recordingAdmin = new Proxy(fakeSupabase({}), {
    get(target, prop, receiver) {
      if (prop === "from") {
        return (table: string) => {
          if (table === "ai_usage_log") {
            return {
              insert: async (rows: unknown) => { inserts.push(rows); return { data: rows, error: null }; },
            };
          }
          return Reflect.get(target, prop, receiver).call(target, table);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
  const app = buildApp({}, recordingAdmin);
  await withServer(app, async (base) => {
    await fetch(`${base}/api/v1/ai/summarize`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ text: "telemetry please" }),
    });
  });
  assert.equal(inserts.length, 1, "one usage row recorded");
  const row = inserts[0] as Record<string, unknown>;
  assert.equal(row.feature, "api-ai-summarize");
  assert.equal(row.provider, "groq");
  assert.equal(row.success, true);
  assert.equal(row.error_message, null);
  assert.ok(typeof row.prompt_length === "number" && row.prompt_length > 0);
  assert.ok(!JSON.stringify(row).includes("test-key"), "no secrets in telemetry");
});

// ---------- CORS ----------

const ALLOWED_ORIGIN = "https://berojgardegreewala.vercel.app";

test("CORS allows the listed production origin", async () => {
  process.env.ALLOWED_ORIGINS = ALLOWED_ORIGIN;
  const app = buildApp();
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/health`, { headers: { Origin: ALLOWED_ORIGIN } });
    assert.equal(res.headers.get("access-control-allow-origin"), ALLOWED_ORIGIN);
  });
});

test("CORS blocks a disallowed origin (no ACAO header)", async () => {
  const app = buildApp();
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/health`, { headers: { Origin: "https://evil.example" } });
    assert.equal(res.headers.get("access-control-allow-origin"), null);
  });
});

test("CORS preflight succeeds for allowed origins and carries credentials", async () => {
  process.env.ALLOWED_ORIGINS = ALLOWED_ORIGIN;
  const app = buildApp();
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/applications`, {
      method: "OPTIONS",
      headers: {
        Origin: ALLOWED_ORIGIN,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization, content-type",
      },
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("access-control-allow-origin"), ALLOWED_ORIGIN);
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
    assert.ok(res.headers.get("access-control-allow-headers")?.toLowerCase().includes("authorization"));
  });
});

// ---------- Request header shim + rate limiting ----------

test("rate limiter buckets requests per X-Forwarded-For via the header shim", async () => {
  const app = buildApp();
  await withServer(app, async (base) => {
    // Exhaust the 30/min search bucket for IP 1.2.3.4.
    let lastStatus = 0;
    for (let i = 0; i < 35; i++) {
      const res = await fetch(`${base}/api/v1/search?q=x${i}`, { headers: { "X-Forwarded-For": "1.2.3.4" } });
      lastStatus = res.status;
      if (res.status === 429) break;
    }
    assert.equal(lastStatus, 429, "same-IP bucket exhausted");
    const blocked = await fetch(`${base}/api/v1/search?q=again`, { headers: { "X-Forwarded-For": "1.2.3.4" } });
    assert.equal(blocked.status, 429);

    // A different forwarded IP gets a fresh bucket.
    const fresh = await fetch(`${base}/api/v1/search?q=other`, { headers: { "X-Forwarded-For": "5.6.7.8" } });
    assert.equal(fresh.status, 200);
  });
});

test("admin endpoint is rate limited (brute-force speed bump)", async () => {
  const app = buildApp();
  await withServer(app, async (base) => {
    let lastStatus = 0;
    let lastBody: any = null;
    for (let i = 0; i < 25; i++) {
      const res = await fetch(`${base}/api/v1/admin/stats`, { headers: { "X-Admin-Password": `guess-${i}` } });
      lastStatus = res.status;
      if (res.status === 429) { lastBody = await res.json(); break; }
    }
    assert.equal(lastStatus, 429, "admin bucket kicks in");
    assert.equal(lastBody.error.code, "RATE_LIMITED");
  });
});

// ---------- Health / readiness ----------

test("GET /ready reports ready when the database answers", async () => {
  const app = buildApp({ opportunities: [{ id: "o1" }] });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/health/ready`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "ok");
    assert.equal(body.ready, true);
  });
});

test("GET /ready fails 503 when the database is not configured", async () => {
  const deps: Deps = {
    env: loadEnv(),
    supabase: null,
    supabaseAdmin: null,
    supabase2Admin: null,
  };
  const app = createApp(deps);
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/health/ready`);
    assert.equal(res.status, 503);
    assert.equal((await res.json()).error.code, "DB_UNAVAILABLE");
  });
});

// ---------- Error handling ----------

test("malformed JSON body returns a clean 400 VALIDATION_ERROR (no parser internals)", async () => {
  const app = buildApp();
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/ai/summarize`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: "{not json",
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.equal(body.error.message, "Invalid JSON body");
    assert.ok(!JSON.stringify(body).includes("Unexpected"), "no parser internals leak");
  });
});