import { test, assert, testApp, withServer } from "./helpers.js";

test("user routes reject missing tokens with 401", async () => {
  const app = testApp();
  await withServer(app, async (base) => {
    for (const path of ["/api/v1/applications", "/api/v1/saved-opportunities", "/api/v1/ai/insights"]) {
      const res = await fetch(`${base}${path}`);
      assert.equal(res.status, 401, path);
      const body = await res.json();
      assert.equal(body.error.code, "UNAUTHORIZED", path);
    }
  });
});

test("user routes reject invalid tokens with 401", async () => {
  const app = testApp();
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/applications`, {
      headers: { Authorization: "Bearer junk-token" },
    });
    assert.equal(res.status, 401);
    assert.equal((await res.json()).error.code, "INVALID_TOKEN");
  });
});

test("applications are scoped to the caller", async () => {
  const app = testApp({
    applications: [{ id: "app-1", status: "applied", applied_at: "2025-01-01" }],
  });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/applications`, {
      headers: { Authorization: "Bearer good-token" },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].id, "app-1");
  });
});

test("POST saved-opportunity with unknown id still writes through (auto join)", async () => {
  const app = testApp({ saved_opportunities: [] });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/saved-opportunities`, {
      method: "POST",
      headers: { Authorization: "Bearer good-token", "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId: "opp-9" }),
    });
    assert.equal(res.status, 201);
    assert.equal((await res.json()).data.created, true);
  });
});