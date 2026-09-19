import { test, assert, testApp, withServer } from "./helpers.js";

test("GET /health returns ok without auth or DB", async () => {
  const app = testApp();
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: "ok" });
  });
});

test("unknown route returns the standard 404 error envelope", async () => {
  const app = testApp();
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/nope`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, "NOT_FOUND");
  });
});

test("CORS allows listed origin, blocks others", async () => {
  const app = testApp(); // default allowedOrigin: http://localhost:3000
  await withServer(app, async (base) => {
    const allowed = await fetch(`${base}/health`, {
      headers: { Origin: "http://localhost:3000" },
    });
    assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:3000");

    const blocked = await fetch(`${base}/health`, {
      headers: { Origin: "http://evil.example.com" },
    });
    assert.equal(blocked.headers.get("access-control-allow-origin"), null);
  });
});