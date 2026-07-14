interface DeadLinkResult {
  valid: boolean;
  statusCode: number | null;
  redirectUrl: string | null;
  error: string | null;
}

export class DeadLinkChecker {
  async check(url: string): Promise<DeadLinkResult> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);

      try {
        const response = await fetch(url, {
          method: "HEAD",
          signal: controller.signal,
          redirect: "follow",
          headers: {
            "User-Agent": "SiliconPath-LinkChecker/1.0",
          },
        });

        clearTimeout(timer);

        const redirectUrl =
          response.redirected && response.url !== url ? response.url : null;

        return {
          valid: response.ok,
          statusCode: response.status,
          redirectUrl,
          error: null,
        };
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return {
          valid: false,
          statusCode: null,
          redirectUrl: null,
          error: "Request timed out after 5s",
        };
      }
      return {
        valid: false,
        statusCode: null,
        redirectUrl: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
