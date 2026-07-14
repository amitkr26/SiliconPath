import { ScrapeQueue, DeadLetterQueue, RateLimiter, RetryHandler } from "../src/engine";
import type { QueueItem, RateLimitConfig, RetryStrategy } from "../src/types";

describe("ScrapeQueue", () => {
  let dlq: DeadLetterQueue;
  let queue: ScrapeQueue;

  beforeEach(() => {
    dlq = new DeadLetterQueue();
    queue = new ScrapeQueue(dlq);
  });

  it("enqueues and dequeues items by priority", () => {
    queue.enqueue({ id: "1", sourceId: "src1", priority: 5, scheduledAt: new Date().toISOString() } as QueueItem);
    queue.enqueue({ id: "2", sourceId: "src2", priority: 1, scheduledAt: new Date().toISOString() } as QueueItem);
    queue.enqueue({ id: "3", sourceId: "src3", priority: 10, scheduledAt: new Date().toISOString() } as QueueItem);
    const first = queue.dequeue();
    expect(first!.id).toBe("2"); // highest priority = lowest number
  });

  it("returns null when empty", () => {
    expect(queue.dequeue()).toBeNull();
  });

  it("returns depth", () => {
    expect(queue.getDepth()).toBe(0);
    queue.enqueue({ id: "1", sourceId: "src1", priority: 1, scheduledAt: new Date().toISOString() } as QueueItem);
    expect(queue.getDepth()).toBe(1);
  });

  it("acks items and moves to completed", () => {
    queue.enqueue({ id: "1", sourceId: "src1", priority: 1, scheduledAt: new Date().toISOString() } as QueueItem);
    queue.dequeue();
    queue.ack("1");
    const status = queue.getStatus();
    expect(status.queued).toBe(0);
    expect(status.completed).toBe(1);
  });

  it("nacks items back to queue", () => {
    queue.enqueue({ id: "1", sourceId: "src1", priority: 1, maxAttempts: 3, scheduledAt: new Date().toISOString() } as QueueItem);
    queue.dequeue();
    queue.nack("1", "timeout");
    expect(queue.getDepth()).toBe(1);
  });

  it("sends to DLQ after max attempts", () => {
    queue.enqueue({ id: "1", sourceId: "src1", priority: 1, maxAttempts: 2, attempts: 1, scheduledAt: new Date().toISOString() } as QueueItem);
    queue.dequeue();
    queue.nack("1", "timeout");
    expect(queue.getDepth()).toBe(0);
    expect(dlq.getDepth()).toBe(1);
  });

  it("returns DLQ reference", () => {
    expect(queue.getDLQ()).toBe(dlq);
  });

  it("returns status with all counters", () => {
    queue.enqueue({ id: "1", sourceId: "src1", priority: 1, scheduledAt: new Date().toISOString() } as QueueItem);
    queue.dequeue();
    queue.ack("1");
    const status = queue.getStatus();
    expect(status).toHaveProperty("queued");
    expect(status).toHaveProperty("processing");
    expect(status).toHaveProperty("completed");
    expect(status).toHaveProperty("failed");
    expect(status).toHaveProperty("dlq");
  });
});

describe("RateLimiter", () => {
  const limits: RateLimitConfig = { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 10000, concurrency: 1 };

  it("allows requests within limit", () => {
    const rl = new RateLimiter();
    expect(rl.tryAcquire("test", limits)).toBe(true);
  });

  it("rejects when window is full", () => {
    const tight: RateLimitConfig = { requestsPerMinute: 2, requestsPerHour: 1000, requestsPerDay: 10000, concurrency: 1 };
    const rl = new RateLimiter();
    expect(rl.tryAcquire("test", tight)).toBe(true);
    expect(rl.tryAcquire("test", tight)).toBe(true);
    expect(rl.tryAcquire("test", tight)).toBe(false);
  });

  it("returns wait time", () => {
    const rl = new RateLimiter();
    const wait = rl.getWaitTime("test", limits);
    expect(typeof wait).toBe("number");
    expect(wait).toBe(0); // no requests made
  });
});

describe("RetryHandler", () => {
  const strategy: RetryStrategy = { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 30000, backoffMultiplier: 2, retryableErrors: [] };

  it("computes delay with exponential backoff", () => {
    const rh = new RetryHandler();
    const d1 = rh.getDelay(1, strategy.baseDelayMs, strategy.maxDelayMs, strategy.backoffMultiplier);
    expect(d1).toBeGreaterThanOrEqual(500);
    const d2 = rh.getDelay(2, strategy.baseDelayMs, strategy.maxDelayMs, strategy.backoffMultiplier);
    expect(d2).toBeGreaterThanOrEqual(1000);
  });

  it("determines retryable errors", () => {
    const rh = new RetryHandler();
    const retryable = ["ECONNRESET", "ETIMEDOUT"];
    expect(rh.isRetryableError("ECONNRESET", retryable)).toBe(true);
    expect(rh.isRetryableError("UNKNOWN_ERR", retryable)).toBe(false);
  });

  it("treats all errors as retryable when list is empty", () => {
    const rh = new RetryHandler();
    expect(rh.isRetryableError("ANY_ERROR", [])).toBe(true);
  });

  it("determines when to retry", () => {
    const rh = new RetryHandler();
    expect(rh.shouldRetry(1, 3)).toBe(true);
    expect(rh.shouldRetry(2, 3)).toBe(true);
    expect(rh.shouldRetry(3, 3)).toBe(false); // attempt < maxAttempts so attempt 3 is beyond max
  });
});

describe("DeadLetterQueue", () => {
  let dlq: DeadLetterQueue;

  beforeEach(() => {
    dlq = new DeadLetterQueue();
  });

  it("sends items to DLQ", () => {
    dlq.send({ id: "1", sourceId: "src1" } as QueueItem, "timeout");
    expect(dlq.getDepth()).toBe(1);
  });

  it("returns all items", () => {
    dlq.send({ id: "1", sourceId: "src1" } as QueueItem, "timeout");
    dlq.send({ id: "2", sourceId: "src2" } as QueueItem, "econnreset");
    expect(dlq.getItems()).toHaveLength(2);
  });

  it("replays a single item by id", () => {
    dlq.send({ id: "1", sourceId: "src1" } as QueueItem, "timeout");
    const replayed = dlq.replay("1");
    expect(replayed).not.toBeNull();
    expect(replayed!.status).toBe("queued");
    expect(dlq.getDepth()).toBe(0);
  });

  it("replays all items", () => {
    dlq.send({ id: "1", sourceId: "src1" } as QueueItem, "timeout");
    dlq.send({ id: "2", sourceId: "src2" } as QueueItem, "econnreset");
    const all = dlq.replayAll();
    expect(all).toHaveLength(2);
    expect(dlq.getDepth()).toBe(0);
  });

  it("purges all items", () => {
    dlq.send({ id: "1", sourceId: "src1" } as QueueItem, "timeout");
    dlq.purge();
    expect(dlq.getDepth()).toBe(0);
  });

  it("replay returns null for unknown id", () => {
    expect(dlq.replay("nonexistent")).toBeNull();
  });
});
