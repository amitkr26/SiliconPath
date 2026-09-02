import { evaluateOpportunityFreshness } from "@/lib/opportunity-freshness";

describe("Opportunity Freshness & Expiry Engine", () => {
  it("marks future deadline (> 7 days) as ACTIVE", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20);

    const meta = evaluateOpportunityFreshness(futureDate.toISOString());
    expect(meta.status).toBe("ACTIVE");
    expect(meta.isExpired).toBe(false);
    expect(meta.daysRemaining).toBeGreaterThan(7);
  });

  it("marks impending deadline (<= 7 days) as EXPIRING_SOON", () => {
    const impendingDate = new Date();
    impendingDate.setDate(impendingDate.getDate() + 3);

    const meta = evaluateOpportunityFreshness(impendingDate.toISOString());
    expect(meta.status).toBe("EXPIRING_SOON");
    expect(meta.isExpired).toBe(false);
    expect(meta.daysRemaining).toBeLessThanOrEqual(7);
  });

  it("marks past deadline as EXPIRED", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const meta = evaluateOpportunityFreshness(pastDate.toISOString());
    expect(meta.status).toBe("EXPIRED");
    expect(meta.isExpired).toBe(true);
    expect(meta.daysRemaining).toBeLessThan(0);
  });

  it("marks undated opportunity without verification as UNVERIFIED", () => {
    const meta = evaluateOpportunityFreshness(null, null);
    expect(meta.status).toBe("UNVERIFIED");
  });
});
