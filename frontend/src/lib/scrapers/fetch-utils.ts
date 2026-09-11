import { Agent } from "undici";

// ponytail: Per-fetch TLS-relaxed agent. Replaces the process-global
// NODE_TLS_REJECT_UNAUTHORIZED = "0" pattern which is not concurrency-safe
// when scrapers run in parallel via Promise.allSettled. This agent only
// affects connections routed through it, leaving the rest of the process
// untouched. Upgrade path: remove once all target hosts have valid certs.
const tlsAgent = new Agent({ connect: { rejectUnauthorized: false } });

export async function fetchWithLooseTLS(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(url, { ...init, dispatcher: tlsAgent } as any);
}
