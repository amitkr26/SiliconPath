export type QueuePriority = "low" | "normal" | "high" | "critical";

export interface QueueJob<T = unknown> {
  id: string;
  type: string;
  payload: T;
  priority: QueuePriority;
  createdAt: string;
  attempts: number;
  maxAttempts: number;
  status: "queued" | "running" | "completed" | "failed";
  error?: string;
  scheduledAt?: string;
}

export interface QueueAdapter {
  enqueue<T>(job: Omit<QueueJob<T>, "id" | "createdAt" | "attempts" | "status">): Promise<string>;
  dequeue<T>(queueName: string): Promise<QueueJob<T> | null>;
  acknowledge(jobId: string): Promise<void>;
  fail(jobId: string, error: string): Promise<void>;
  getStatus(jobId: string): Promise<QueueJob["status"] | null>;
  getLength(queueName: string): Promise<number>;
}

export interface QueueOptions {
  maxAttempts?: number;
  retryDelayMs?: number;
  concurrency?: number;
}
