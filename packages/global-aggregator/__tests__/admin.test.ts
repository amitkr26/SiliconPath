import { AdminDashboard } from "../src/admin";
import { Classifier } from "../src/classification";
import { SearchEngine } from "../src/search";
import { Monitor } from "../src/monitoring";
import type { SourceConfig, NormalizedOpportunity } from "../src/types";
import type { ScrapeEngineInterface, PipelineInterface, ValidatorInterface } from "../src/admin";

describe("AdminDashboard", () => {
  const mockEngine: ScrapeEngineInterface = {
    triggerSource: async () => ({
      jobId: "job-1", sourceId: "src1", sourceName: "Test", success: true, count: 0, errors: [], durationMs: 100, items: [], timestamp: new Date().toISOString(),
    }),
    pauseSource: () => {},
    resumeSource: () => {},
    setSourcePriority: () => {},
    getSourceStatus: () => "active",
    getAllSourceIds: () => ["src1", "src2"],
  };

  const mockPipeline: PipelineInterface = {
    getStats: () => ({ totalProcessed: 500, totalDeduplicated: 10, totalFailed: 5 }),
  };

  const mockValidator: ValidatorInterface = {
    getStats: () => ({ totalValidated: 500, totalPassed: 450, totalFailed: 50 }),
  };

  const mockClassifier = new Classifier();
  const mockSearchEngine = new SearchEngine();
  const mockMonitor = new Monitor();

  function createDashboard() {
    return new AdminDashboard(mockEngine, mockPipeline, mockValidator, mockClassifier, mockSearchEngine, mockMonitor);
  }

  it("creates dashboard with all modules", () => {
    const dashboard = createDashboard();
    expect(dashboard).toBeDefined();
  });

  it("returns source health", () => {
    const dashboard = createDashboard();
    const health = dashboard.getSourceHealth();
    expect(Array.isArray(health)).toBe(true);
  });

  it("returns worker health", () => {
    const dashboard = createDashboard();
    const health = dashboard.getWorkerHealth();
    expect(health).toHaveProperty("active");
    expect(health).toHaveProperty("idle");
    expect(health).toHaveProperty("total");
  });

  it("returns queue health", () => {
    const dashboard = createDashboard();
    const health = dashboard.getQueueHealth();
    expect(health).toHaveProperty("queued");
    expect(health).toHaveProperty("processing");
    expect(health).toHaveProperty("completed");
  });

  it("returns metrics", () => {
    const dashboard = createDashboard();
    const metrics = dashboard.getMetrics();
    expect(metrics).toHaveProperty("sourcesTotal");
    expect(metrics).toHaveProperty("queueDepth");
  });

  it("returns pipeline stats", () => {
    const dashboard = createDashboard();
    const stats = dashboard.getPipelineStats();
    expect(stats.totalProcessed).toBe(500);
  });

  it("returns validator stats", () => {
    const dashboard = createDashboard();
    const stats = dashboard.getValidatorStats();
    expect(stats.totalValidated).toBe(500);
  });

  it("returns classifier stats", () => {
    const dashboard = createDashboard();
    const stats = dashboard.getClassifierStats();
    expect(stats).toHaveProperty("totalClassified");
  });

  it("returns adapter breakdown", () => {
    const dashboard = createDashboard();
    const breakdown = dashboard.getAdapterBreakdown();
    expect(Array.isArray(breakdown)).toBe(true);
  });

  it("triggers source via engine", async () => {
    const dashboard = createDashboard();
    const result = await dashboard.triggerSource("src1");
    expect(result.success).toBe(true);
  });

  it("pauses source", () => {
    const dashboard = createDashboard();
    expect(() => dashboard.pauseSource("src1")).not.toThrow();
  });

  it("resumes source", () => {
    const dashboard = createDashboard();
    expect(() => dashboard.resumeSource("src1")).not.toThrow();
  });

  it("sets source priority", () => {
    const dashboard = createDashboard();
    expect(() => dashboard.setSourcePriority("src1", 5)).not.toThrow();
  });

  it("manages logs", () => {
    const dashboard = createDashboard();
    const logs = dashboard.getLogs();
    expect(Array.isArray(logs)).toBe(true);
  });

  it("manages pending jobs", () => {
    const dashboard = createDashboard();
    dashboard.enqueueJob({
      id: "job-1", sourceId: "src1", priority: 1, scheduledAt: new Date().toISOString(),
      status: "queued", attempts: 0, maxAttempts: 3, lastError: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    const retry = dashboard.getRetryQueue();
    expect(Array.isArray(retry)).toBe(true);
  });
});
