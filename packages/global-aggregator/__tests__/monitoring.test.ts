import { Monitor } from "../src/monitoring";
import type { ScrapeResult, NormalizedOpportunity } from "../src/types";

const makeResult = (overrides: Partial<ScrapeResult> = {}): ScrapeResult => ({
  jobId: "job-1",
  sourceId: "src-1",
  sourceName: "Test Source",
  success: true,
  count: 5,
  errors: [],
  durationMs: 100,
  items: [],
  timestamp: new Date().toISOString(),
  ...overrides,
});

describe("Monitor", () => {
  let monitor: Monitor;

  beforeEach(() => {
    monitor = new Monitor();
  });

  it("records a successful scrape", () => {
    monitor.recordScrape(makeResult({ sourceId: "src1", success: true, count: 5, durationMs: 100 }));
    const stats = monitor.getStats();
    expect(stats.sourcesTotal).toBe(1);
    expect(stats.scrapesToday).toBeGreaterThanOrEqual(1);
    expect(stats.scrapeSuccessRate).toBeGreaterThan(0);
  });

  it("tracks failed scrapes", () => {
    monitor.recordScrape(makeResult({ sourceId: "src1", success: false, count: 0, durationMs: 500, errors: ["timeout"] }));
    const stats = monitor.getStats();
    expect(stats.sourcesTotal).toBe(1);
    expect(stats.scrapeSuccessRate).toBe(0);
  });

  it("tracks multiple scrapes across sources", () => {
    monitor.recordScrape(makeResult({ sourceId: "s1", success: true, count: 10 }));
    monitor.recordScrape(makeResult({ sourceId: "s2", success: true, count: 5 }));
    const stats = monitor.getStats();
    expect(stats.sourcesTotal).toBe(2);
  });

  it("records queue depth", () => {
    monitor.recordQueueDepth(15);
    const stats = monitor.getStats();
    expect(stats.queueDepth).toBe(15);
  });

  it("records worker status", () => {
    monitor.recordWorkerStatus(3, 2);
    const stats = monitor.getStats();
    expect(stats.workersActive).toBe(3);
    expect(stats.workersIdle).toBe(2);
  });

  it("records source health", () => {
    monitor.recordScrape(makeResult({ sourceId: "s1" }));
    monitor.recordSourceHealth("s1", true);
    const stats = monitor.getStats();
    expect(stats.sourcesHealthy).toBeGreaterThan(0);
  });

  it("returns adapter health reports", () => {
    monitor.recordScrape(makeResult({ sourceId: "s1", success: true, count: 5 }));
    const reports = monitor.getAdapterHealthReport();
    expect(reports.length).toBeGreaterThan(0);
    expect(reports[0]).toHaveProperty("adapter");
    expect(reports[0]).toHaveProperty("successRate");
  });

  it("returns source health reports", () => {
    monitor.recordScrape(makeResult({ sourceId: "s1", sourceName: "Test Source" }));
    const reports = monitor.getSourceHealthReports();
    expect(reports.length).toBeGreaterThan(0);
    expect(reports[0].sourceId).toBe("s1");
    expect(reports[0].sourceName).toBe("Test Source");
  });

  it("records DLQ depth", () => {
    monitor.recordDLQDepth(3);
    const stats = monitor.getStats();
    expect(stats.dlqDepth).toBe(3);
  });

  it("resets all stats", () => {
    monitor.recordScrape(makeResult({ sourceId: "s1" }));
    monitor.reset();
    const stats = monitor.getStats();
    expect(stats.sourcesTotal).toBe(0);
  });
});
