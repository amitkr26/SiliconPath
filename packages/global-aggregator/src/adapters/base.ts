import type {
  AdapterType,
  RawScrapedOpportunity,
  SourceConfig,
} from "../types";

export abstract class BaseAdapter {
  abstract readonly type: AdapterType;

  abstract scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]>;

  canHandle(source: SourceConfig): boolean {
    return source.adapter === this.type;
  }

  protected async fetchWithTimeout(
    url: string,
    options?: RequestInit,
    timeoutMs = 30_000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  protected extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  protected normalizeUrl(base: string, path: string): string {
    try {
      return new URL(path, base).href;
    } catch {
      return path;
    }
  }

  protected sanitizeText(text: string | null | undefined): string {
    return (text ?? "").trim();
  }

  protected parseDate(dateStr: string | null | undefined): string | null {
    const text = this.sanitizeText(dateStr);
    if (!text) return null;

    const lower = text.toLowerCase();
    const now = new Date();
    let ms = 0;

    if (lower === "today") {
      return now.toISOString();
    }
    if (lower === "tomorrow") {
      ms = 24 * 60 * 60 * 1000;
    } else if (lower === "yesterday") {
      ms = -24 * 60 * 60 * 1000;
    } else {
      const ago = lower.match(/(\d+)\s+days?\s+ago/);
      const fromNow = lower.match(/(\d+)\s+days?\s+from\s+now/);
      const weeksAgo = lower.match(/(\d+)\s+weeks?\s+ago/);
      const weeksFromNow = lower.match(/(\d+)\s+weeks?\s+from\s+now/);

      if (ago) {
        ms = -Number(ago[1]) * 24 * 60 * 60 * 1000;
      } else if (fromNow) {
        ms = Number(fromNow[1]) * 24 * 60 * 60 * 1000;
      } else if (weeksAgo) {
        ms = -Number(weeksAgo[1]) * 7 * 24 * 60 * 60 * 1000;
      } else if (weeksFromNow) {
        ms = Number(weeksFromNow[1]) * 7 * 24 * 60 * 60 * 1000;
      } else {
        const parsed = new Date(text);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
        return null;
      }
    }

    const target = new Date(now.getTime() + ms);
    return Number.isNaN(target.getTime()) ? null : target.toISOString();
  }
}
