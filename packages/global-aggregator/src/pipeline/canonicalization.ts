const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "utm_cid",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
  "via",
  "campaign",
  "medium",
  "referrer",
]);

export class Canonicalizer {
  canonicalize(url: string): string {
    try {
      const parsed = new URL(url);
      parsed.protocol = "https:";
      parsed.hostname = parsed.hostname.toLowerCase();
      parsed.pathname = this.normalizePath(parsed.pathname);
      this.stripTrackingParams(parsed);
      this.sortQueryParams(parsed);
      parsed.hash = "";
      return parsed.href;
    } catch {
      return url;
    }
  }

  stripUtmParams(url: string): string {
    try {
      const parsed = new URL(url);
      this.stripTrackingParams(parsed);
      return parsed.href;
    } catch {
      return url;
    }
  }

  ensureHttps(url: string): string {
    try {
      const parsed = new URL(url);
      parsed.protocol = "https:";
      return parsed.href;
    } catch {
      return url;
    }
  }

  private normalizePath(pathname: string): string {
    if (pathname.length > 1 && pathname.endsWith("/")) {
      return pathname.slice(0, -1);
    }
    return pathname;
  }

  private stripTrackingParams(parsed: URL): void {
    for (const param of TRACKING_PARAMS) {
      parsed.searchParams.delete(param);
    }
  }

  private sortQueryParams(parsed: URL): void {
    const entries = Array.from(parsed.searchParams.entries());
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    parsed.search = "";
    for (const [key, value] of entries) {
      parsed.searchParams.append(key, value);
    }
  }
}
