export class RetryHandler {
  shouldRetry(attempt: number, maxAttempts: number): boolean {
    return attempt < maxAttempts;
  }

  getDelay(
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number,
    multiplier: number,
  ): number {
    const exponential = baseDelayMs * Math.pow(multiplier, attempt);
    const capped = Math.min(exponential, maxDelayMs);
    const jitter = capped * (0.5 + Math.random() * 0.5);
    return Math.round(jitter);
  }

  isRetryableError(error: string, retryableErrors: string[]): boolean {
    if (retryableErrors.length === 0) return true;
    const lower = error.toLowerCase();
    return retryableErrors.some((re) => lower.includes(re.toLowerCase()));
  }
}
