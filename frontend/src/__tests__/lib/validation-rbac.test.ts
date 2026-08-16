/**
 * @jest-environment node
 */
// P0.5 — Phase 1.6 RBAC validation: mass-assignment defense + status whitelist.
// The schemas must reject dead/unknown columns (which 400'd on PostgREST) and
// only ever admit the live applications status lifecycle.
import {
  organizationCreateSchema,
  applicationStatusUpdateSchema,
  mapAdminOpportunityColumns,
  adminOpportunityUpdateSchema,
} from "@/lib/validation";

describe("organizationCreateSchema (live-columns, strict)", () => {
  test("accepts a minimal valid org", () => {
    const r = organizationCreateSchema.safeParse({ name: "Nexperia" });
    expect(r.success).toBe(true);
  });
  test("accepts all live columns", () => {
    const r = organizationCreateSchema.safeParse({
      name: "ISRO",
      slug: "isro",
      type: "government",
      country: "India",
      location: "Bengaluru",
      website: "https://www.isro.gov.in",
      description: "Space agency",
      is_active: true,
      is_verified: false,
    });
    expect(r.success).toBe(true);
  });
  test("rejects dead columns (mass-assignment defense)", () => {
    const r = organizationCreateSchema.safeParse({
      name: "X",
      headquarters: "Delhi", // dead column — old schema had it, live DB does not
      founded_year: 1950,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(JSON.stringify(r.error.issues)).toContain("headquarters");
      expect(JSON.stringify(r.error.issues)).toContain("founded_year");
    }
  });
  test("rejects unknown keys under strict()", () => {
    const r = organizationCreateSchema.safeParse({ name: "X", is_auto_scraped: true });
    expect(r.success).toBe(false);
  });
});

describe("applicationStatusUpdateSchema", () => {
  test("accepts the live lifecycle values", () => {
    for (const s of ["applied", "submitted", "reviewed", "shortlisted", "accepted", "rejected"]) {
      expect(applicationStatusUpdateSchema.safeParse({ status: s }).success).toBe(true);
    }
  });
  test("rejects out-of-lifecycle statuses", () => {
    expect(applicationStatusUpdateSchema.safeParse({ status: "hired" }).success).toBe(false);
    expect(applicationStatusUpdateSchema.safeParse({ status: "PENDING" }).success).toBe(false);
  });
  test("strips unknown keys so they never reach the UPDATE", () => {
    const parsed = applicationStatusUpdateSchema.safeParse({ status: "applied", user_id: "x", is_active: false });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect("user_id" in parsed.data).toBe(false);
      expect("is_active" in parsed.data).toBe(false);
    }
  });
  test("rejects oversized notes", () => {
    expect(applicationStatusUpdateSchema.safeParse({ notes: "n".repeat(2001) }).success).toBe(false);
  });
});

describe("mapAdminOpportunityColumns", () => {
  test("maps legacy fields to live columns", () => {
    const out = mapAdminOpportunityColumns({ stipend: "₹30k", apply_link: "https://x.com", title: "T" });
    expect(out).toEqual({ title: "T", salary_range: "₹30k", apply_url: "https://x.com" });
  });
  test("create defaults apply_url to empty string (NOT NULL) and salary_range to null", () => {
    const out = mapAdminOpportunityColumns({ title: "T" }, true);
    expect(out.apply_url).toBe("");
    expect(out.salary_range).toBeNull();
  });
  test("edit skips empty legacy fields so they never clobber stored values", () => {
    const out = mapAdminOpportunityColumns({ stipend: "", apply_link: "", title: "T" });
    expect(out).toEqual({ title: "T" });
  });
  test("drops legacy organization text (org handled by resolver)", () => {
    const out = mapAdminOpportunityColumns({ organization: "DRDO", title: "T" });
    expect("organization" in out).toBe(false);
  });
});

describe("adminOpportunityUpdateSchema", () => {
  test("rejects verification_status outside the live CHECK values", () => {
    expect(adminOpportunityUpdateSchema.safeParse({ verification_status: "pending" }).success).toBe(false);
    expect(adminOpportunityUpdateSchema.safeParse({ verification_status: "verified" }).success).toBe(true);
  });
  test("strips unknown keys (mapped path, so tolerated)", () => {
    const parsed = adminOpportunityUpdateSchema.safeParse({ title: "Software Engineer", user_id: "evil" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect("user_id" in parsed.data).toBe(false);
  });
});
