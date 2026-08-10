import { test, assert, testApp, withServer } from "./helpers.js";

const OPP = {
  id: "11111111-1111-1111-1111-111111111111",
  slug: "gst-intern",
  title: "Internship at GST consultancy",
  description: "Help with GST filings.",
  category: "Internship",
  location: "Remote",
  stipend: "₹5,000/month",
  deadline: "2030-01-01",
  eligibility: "All",
  apply_url: "/apply/gst-intern",
  source_type: "manual",
  is_active: true,
  created_at: "2025-01-01T00:00:00Z",
};

test("GET /api/v1/opportunities lists active opportunities with pagination", async () => {
  const app = testApp({ opportunities: [OPP] });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/opportunities?page=1&limit=10`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].slug, "gst-intern");
    assert.equal(body.data[0].is_expired, false);
    assert.equal(body.pagination.total, 1);
  });
});

test("GET by slug resolves via slug lookup", async () => {
  const app = testApp({ opportunities: [OPP] });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/opportunities/gst-intern`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.title, OPP.title);
  });
});

test("GET by unknown slug returns 404", async () => {
  const app = testApp({ opportunities: [] });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/opportunities/does-not-exist`);
    assert.equal(res.status, 404);
    assert.equal((await res.json()).error.code, "NOT_FOUND");
  });
});

test("invalid page query returns 400 with validation details", async () => {
  const app = testApp({ opportunities: [] });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/v1/opportunities?page=0`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.ok(body.error.details);
  });
});