import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isElectronicsNews, autoTag, runNewsSync } from "../src/workers/news-sync.js";

describe("isElectronicsNews", () => {
  it("passes tier-1 articles with one keyword hit", () => {
    assert.ok(isElectronicsNews("New FPGA chip announced", null, 1));
  });
  it("rejects tier-1 articles with zero hits", () => {
    assert.ok(!isElectronicsNews("Cooking tips for summer", "Delicious salad recipes", 1));
  });
  it("requires two hits for tier-2 sources", () => {
    // "processor" alone = 1 hit → fails tier-2 threshold
    assert.ok(!isElectronicsNews("New processor launched", "Fast machine", 2));
    // "processor" + "chip" = 2 hits → passes tier-2 threshold
    assert.ok(isElectronicsNews("New processor chip launched", "Faster semiconductor", 2));
  });
});

describe("autoTag", () => {
  it("extracts relevant tags", () => {
    const tags = autoTag("FPGA design for 5G base stations", "New ASIC technology");
    assert.ok(tags.includes("fpga"));
    assert.ok(tags.includes("5g"));
    assert.ok(tags.includes("asic"));
    assert.ok(tags.length <= 5);
  });
  it("returns empty for unrelated text", () => {
    assert.deepEqual(autoTag("Cooking pasta", "Boil water"), []);
  });
});

describe("runNewsSync (integration)", () => {
  it("returns a SyncResult shape (needs live DB to actually upsert)", async () => {
    // This test verifies the function signature and return type.
    // A real integration test would require a test Supabase project.
    // ponytail: integration test ceiling — needs test DB. Upgrade path: use supabase local.
    const fakeSupabase = {
      from: () => ({
        upsert: async () => ({ error: null }),
      }),
    } as any;
    const result = await runNewsSync(fakeSupabase);
    assert.ok(typeof result.fetched === "number");
    assert.ok(typeof result.inserted === "number");
    assert.ok(typeof result.errors === "number");
  });
});
