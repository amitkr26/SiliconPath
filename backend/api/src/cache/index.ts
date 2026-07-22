export function cacheHeaders(maxAge: number, staleWhileRevalidate = 0): Record<string, string> {
  const parts = [`max-age=${maxAge}`];
  if (staleWhileRevalidate > 0) parts.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  return { "Cache-Control": parts.join(", ") };
}

export function noCache(): Record<string, string> {
  return { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" };
}

export function etag(data: string | object): string {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return `W/"${hash.toString(16)}"`;
}

export function checkETag(request: Request, entityTag: string): boolean {
  const ifNoneMatch = request.headers.get("if-none-match");
  return ifNoneMatch === entityTag;
}

export function generateETag(data: string | object): string {
  return etag(data);
}

export function conditionalResponse<T>(
  request: Request,
  data: T,
  entityTag: string,
  maxAge = 0
): Response {
  if (checkETag(request, entityTag)) {
    return new Response(null, { status: 304, headers: { ETag: entityTag } });
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ETag: entityTag,
  };
  if (maxAge > 0) headers["Cache-Control"] = `max-age=${maxAge}`;
  return new Response(JSON.stringify(data), { headers });
}