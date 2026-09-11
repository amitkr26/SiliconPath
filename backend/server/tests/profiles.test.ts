import { test, assert, testApp, withServer } from "./helpers.js";

const PROFILE = {
  id: "user-1",
  username: "rahul_sharma",
  display_name: "Rahul Sharma",
  headline: "B.Com graduate",
  bio: "Looking for accounting internships.",
  location: "Delhi",
  skills: ["Excel", "Tally"],
  email: "rahul@example.com", // must NOT leak server-side
  email_notifications: true,
};

test("GET /api/v1/profiles/:username returns public profile, lowercased lookup", async () => {
  const app = testApp({ user_profiles: [PROFILE] });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/profiles/RAHUL_SHARMA`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.username, "rahul_sharma");
    assert.equal(body.data.profile_url, "/profile/rahul_sharma");
    assert.equal(body.data.email, undefined); // private field stripped
    assert.equal(body.data.email_notifications, undefined);
  });
});

test("GET /api/v1/profiles/:username unknown user returns 404", async () => {
  const app = testApp({ user_profiles: [] });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/profiles/nobody`);
    assert.equal(res.status, 404);
    assert.equal((await res.json()).error.code, "NOT_FOUND");
  });
});

test("GET /api/v1/profiles/me requires auth", async () => {
  const app = testApp({ user_profiles: [PROFILE] });
  await withServer(app, async (base) => {
    const unauth = await fetch(`${base}/api/v1/profiles/me`);
    assert.equal(unauth.status, 401);

    const auth = await fetch(`${base}/api/v1/profiles/me`, {
      headers: { Authorization: "Bearer good-token" },
    });
    assert.equal(auth.status, 200);
    assert.equal((await auth.json()).data.id, "user-1");
  });
});