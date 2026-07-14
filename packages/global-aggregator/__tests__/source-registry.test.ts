import { SourceRegistry, CATEGORY_META, sources } from "../src/source-registry";

describe("SourceRegistry", () => {
  let registry: SourceRegistry;

  beforeEach(() => {
    registry = new SourceRegistry(sources);
  });

  it("returns all sources", () => {
    const all = registry.getAll();
    expect(all.length).toBeGreaterThan(100);
  });

  it("gets a source by id", () => {
    const s = registry.get("tsmc");
    expect(s).toBeDefined();
    expect(s!.name).toBe("TSMC");
  });

  it("returns undefined for unknown id", () => {
    expect(registry.get("nonexistent")).toBeUndefined();
  });

  it("gets sources by category", () => {
    const cat = registry.getByCategory("semiconductor-idm");
    expect(cat.length).toBeGreaterThan(0);
    expect(cat.every((s) => s.category === "semiconductor-idm")).toBe(true);
  });

  it("gets sources by adapter type", () => {
    const rss = registry.getByAdapter("rss");
    expect(rss.length).toBeGreaterThan(0);
    expect(rss.every((s) => s.adapter === "rss")).toBe(true);
  });

  it("gets sources by status", () => {
    const active = registry.getByStatus("active");
    expect(active.length).toBeGreaterThan(0);
    expect(active.every((s) => s.status === "active")).toBe(true);
  });

  it("gets sources by batch", () => {
    const batch = registry.getByBatch(1);
    expect(batch.length).toBeGreaterThan(0);
    expect(batch.every((s) => s.scheduling.batchId === 1)).toBe(true);
  });

  it("searches sources by name", () => {
    const results = registry.search("tsmc");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((s) => s.id === "tsmc")).toBe(true);
  });

  it("returns total size", () => {
    expect(registry.size()).toBe(sources.length);
  });

  it("returns categories", () => {
    const cats = registry.getCategories();
    expect(cats.length).toBeGreaterThan(0);
    expect(cats).toContain("semiconductor-idm");
  });

  it("updates source health", () => {
    registry.update("tsmc", { health: "unhealthy" });
    expect(registry.get("tsmc")!.health).toBe("unhealthy");
    registry.update("tsmc", { health: "healthy" });
    expect(registry.get("tsmc")!.health).toBe("healthy");
  });

  it("CATEGORY_META has expected entries", () => {
    expect(CATEGORY_META["semiconductor-idm"]).toBeDefined();
    expect(CATEGORY_META["semiconductor-idm"].label).toBe("Semiconductor IDM");
    expect(CATEGORY_META["university-india"]).toBeDefined();
    expect(CATEGORY_META["university-india"].label).toBe("Universities — India");
  });
});
