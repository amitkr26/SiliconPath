import type { GatewayResponse } from "../types/gateway";

interface CacheEntry {
  response: GatewayResponse;
  createdAt: number;
  ttlMs: number;
  hits: number;
}

export class ResponseCache {
  private store = new Map<string, CacheEntry>();
  private totalHits = 0;
  private totalMisses = 0;

  private hash(input: string): string {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  buildKey(params: {
    prompt?: string;
    model?: string;
    temperature?: number;
    systemPrompt?: string;
    messages?: Array<{ role: string; content: string }>;
  }): string {
    const payload = [
      params.prompt ?? "",
      params.model ?? "",
      String(params.temperature ?? ""),
      params.systemPrompt ?? "",
      params.messages ? JSON.stringify(params.messages) : "",
    ].join("\0");
    return this.hash(payload);
  }

  async get(key: string): Promise<GatewayResponse | null> {
    const entry = this.store.get(key);
    if (!entry) {
      this.totalMisses++;
      return null;
    }
    if (Date.now() - entry.createdAt > entry.ttlMs) {
      this.store.delete(key);
      this.totalMisses++;
      return null;
    }
    entry.hits++;
    this.totalHits++;
    return entry.response;
  }

  async set(
    key: string,
    response: GatewayResponse,
    ttlMs: number,
  ): Promise<void> {
    this.store.set(key, {
      response,
      createdAt: Date.now(),
      ttlMs,
      hits: 0,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.totalHits = 0;
    this.totalMisses = 0;
  }

  async getStats(): Promise<{ hits: number; misses: number; size: number }> {
    return {
      hits: this.totalHits,
      misses: this.totalMisses,
      size: this.store.size,
    };
  }
}

export const responseCache = new ResponseCache();
