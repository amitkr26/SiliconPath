import type {
  AdapterType,
  MonitoringStats,
  SourceHealthReport,
  QueueItem,
  ScrapeResult,
  SourceStatus,
} from "../types";
import type { Classifier } from "../classification";
import type { SearchEngine } from "../search";
import type { Monitor } from "../monitoring";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  sourceId?: string;
  message: string;
  data?: Record<string, unknown>;
}

interface AdapterBreakdown {
  adapter: AdapterType;
  count: number;
  successRate: number;
}

export interface ScrapeEngineInterface {
  triggerSource(sourceId: string): Promise<ScrapeResult>;
  pauseSource(sourceId: string): void;
  resumeSource(sourceId: string): void;
  setSourcePriority(sourceId: string, priority: number): void;
  getSourceStatus(sourceId: string): SourceStatus | undefined;
  getAllSourceIds(): string[];
}

export interface PipelineInterface {
  getStats(): {
    totalProcessed: number;
    totalDeduplicated: number;
    totalFailed: number;
  };
}

export interface ValidatorInterface {
  getStats(): {
    totalValidated: number;
    totalPassed: number;
    totalFailed: number;
  };
}

function generateLogId(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 8; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return `log_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export class AdminDashboard {
  private readonly engine: ScrapeEngineInterface;
  private readonly pipeline: PipelineInterface;
  private readonly validator: ValidatorInterface;
  private readonly classifier: Classifier;
  private readonly searchEngine: SearchEngine;
  private readonly monitor: Monitor;
  private readonly logs: LogEntry[] = [];
  private readonly pendingJobs = new Map<string, QueueItem>();

  constructor(
    engine: ScrapeEngineInterface,
    pipeline: PipelineInterface,
    validator: ValidatorInterface,
    classifier: Classifier,
    searchEngine: SearchEngine,
    monitor: Monitor,
  ) {
    this.engine = engine;
    this.pipeline = pipeline;
    this.validator = validator;
    this.classifier = classifier;
    this.searchEngine = searchEngine;
    this.monitor = monitor;
  }

  getSourceHealth(): SourceHealthReport[] {
    return this.monitor.getSourceHealthReports();
  }

  getWorkerHealth(): { active: number; idle: number; total: number } {
    const stats = this.monitor.getStats();
    return {
      active: stats.workersActive,
      idle: stats.workersIdle,
      total: stats.workersActive + stats.workersIdle,
    };
  }

  getQueueHealth(): {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    dlq: number;
  } {
    const stats = this.monitor.getStats();
    const allJobs = Array.from(this.pendingJobs.values());
    return {
      queued: allJobs.filter((j) => j.status === "queued").length,
      processing: allJobs.filter((j) => j.status === "processing").length,
      completed: allJobs.filter((j) => j.status === "completed").length,
      failed: allJobs.filter((j) => j.status === "failed").length,
      dlq: stats.dlqDepth,
    };
  }

  getRetryQueue(): QueueItem[] {
    return Array.from(this.pendingJobs.values()).filter(
      (j) => j.status === "queued" && j.attempts > 0,
    );
  }

  async triggerSource(sourceId: string): Promise<ScrapeResult> {
    this.addLog("info", sourceId, `Manually triggered source ${sourceId}`);
    return this.engine.triggerSource(sourceId);
  }

  pauseSource(sourceId: string): void {
    this.engine.pauseSource(sourceId);
    this.addLog("info", sourceId, `Paused source ${sourceId}`);
  }

  resumeSource(sourceId: string): void {
    this.engine.resumeSource(sourceId);
    this.addLog("info", sourceId, `Resumed source ${sourceId}`);
  }

  setSourcePriority(sourceId: string, priority: number): void {
    this.engine.setSourcePriority(sourceId, priority);
    this.addLog("info", sourceId, `Set priority ${priority} for source ${sourceId}`);
  }

  getLogs(sourceId?: string, limit = 100): LogEntry[] {
    let entries = this.logs;
    if (sourceId) {
      entries = entries.filter((e) => e.sourceId === sourceId);
    }
    return entries.slice(-limit);
  }

  getMetrics(): MonitoringStats {
    return this.monitor.getStats();
  }

  getAdapterBreakdown(): AdapterBreakdown[] {
    const reports = this.monitor.getAdapterHealthReport();
    return reports.map((report) => ({
      adapter: report.adapter,
      count: report.totalRequests,
      successRate: report.successRate,
    }));
  }

  getClassifierStats(): { totalClassified: number; aiClassified: number; ruleClassified: number } {
    return this.classifier.getStats();
  }

  getPipelineStats(): { totalProcessed: number; totalDeduplicated: number; totalFailed: number } {
    return this.pipeline.getStats();
  }

  getValidatorStats(): { totalValidated: number; totalPassed: number; totalFailed: number } {
    return this.validator.getStats();
  }

  enqueueJob(item: QueueItem): void {
    this.pendingJobs.set(item.id, item);
  }

  private addLog(level: LogEntry["level"], sourceId: string | undefined, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      id: generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      sourceId,
      message,
      data,
    };
    this.logs.push(entry);
    if (this.logs.length > 1000) {
      this.logs.splice(0, this.logs.length - 1000);
    }
  }
}
