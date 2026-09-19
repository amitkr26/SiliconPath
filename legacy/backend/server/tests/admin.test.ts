import { test, assert, testApp, withServer } from "./helpers.js";
import { loadEnv } from "../src/config/env.js";

test("admin stats require correct X-Admin-Password", async () => {
  const env = loadEnv();
  const app = testApp({
    opportunities: [{ id: "o1" }],
    organizations: [{ id: "org1" }],
    user_profiles: [{ id: "u1" }],
    news_articles: [{ id: "n1" }],
  });

  await withServer(app, async (base) => {
    // ADMIN_PASSWORD is unset in tests -> always forbidden
    const noPass = await fetch(`${base}/api/v1/admin/stats`);
    assert.equal(noPass.status, 403);
    assert.equal((await noPass.json()).error.code, "FORBIDDEN");

    const wrongPass = await fetch(`${base}/api/v1/admin/stats`, {
      headers: { "x-admin-password": "guess" },
    });
    assert.equal(wrongPass.status, 403);
  });
});

test("admin stats respond 200 when password configured", async () => {
  process.env.ADMIN_PASSWORD = "s3cret";
  try {
    const app = testApp({
      opportunities: [{ id: "o1" }, { id: "o2" }],
      organizations: [{ id: "org1" }],
      user_profiles: [{ id: "u1" }],
      news_articles: [{ id: "n1" }],
    });
    await withServer(app, async (base) => {
      const res = await fetch(`${base}/api/v1/admin/stats`, {
        headers: { "x-admin-password": "s3cret" },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.deepEqual(body.data.counts, { opportunities: 2, organizations: 1, profiles: 1, news: 1 });
    });
  } finally {
    delete process.env.ADMIN_PASSWORD;
  }
});