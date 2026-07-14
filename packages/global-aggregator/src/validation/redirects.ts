interface RedirectResult {
  finalUrl: string;
  redirectCount: number;
  chain: string[];
}

export class RedirectDetector {
  async follow(
    url: string,
    maxRedirects: number = 10,
  ): Promise<RedirectResult> {
    const chain: string[] = [url];
    let current = url;
    let count = 0;

    while (count < maxRedirects) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10_000);

        const response = await fetch(current, {
          method: "HEAD",
          signal: controller.signal,
          redirect: "manual",
          headers: {
            "User-Agent": "SiliconPath-RedirectChecker/1.0",
          },
        });

        clearTimeout(timer);

        if (
          response.status >= 300 &&
          response.status < 400
        ) {
          const location = response.headers.get("location");
          if (!location) break;

          const nextUrl = this.resolveUrl(current, location);

          if (chain.includes(nextUrl)) {
            chain.push(nextUrl);
            break;
          }

          current = nextUrl;
          chain.push(current);
          count++;
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    return {
      finalUrl: current,
      redirectCount: count,
      chain,
    };
  }

  private resolveUrl(base: string, relative: string): string {
    try {
      return new URL(relative, base).href;
    } catch {
      return relative;
    }
  }
}
