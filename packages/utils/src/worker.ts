import type { QueueJob } from "./queue";

export interface WorkerHandler<T = unknown> {
  type: string;
  handle(job: QueueJob<T>): Promise<void>;
  concurrency?: number;
}

export interface WorkerPool {
  register(handler: WorkerHandler): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): WorkerPoolStatus;
}

export interface WorkerPoolStatus {
  activeWorkers: number;
  queuedJobs: number;
  completedJobs: number;
  failedJobs: number;
  isRunning: boolean;
}

export interface WorkerOptions {
  pollIntervalMs?: number;
  maxConcurrency?: number;
}
