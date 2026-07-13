type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiOptions extends Omit<RequestInit, "method"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface ApiErrorBody {
  error: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(message: string, status: number, body: ApiErrorBody | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function buildUrl(path: string, params?: ApiOptions["params"]): string {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const {
    params,
    timeout = 15000,
    retries = 0,
    retryDelay = 500,
    headers: customHeaders,
    ...rest
  } = options;

  const url = buildUrl(path, params);

  const headers = new Headers(customHeaders);
  if (!headers.has("Content-Type") && method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchOptions: RequestInit = {
    method,
    headers,
    signal: controller.signal,
    ...rest,
  };

  let lastError: Error | null = null;
  const maxAttempts = retries + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        let body: ApiErrorBody | null = null;
        try {
          body = await response.json();
        } catch {
          // ignore parse errors
        }
        throw new ApiError(
          body?.error || response.statusText || `Request failed with status ${response.status}`,
          response.status,
          body,
        );
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error as Error;
      if (error instanceof ApiError) {
        if (error.status < 500 && error.status !== 429) throw error;
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError("Request timed out", 408);
      }
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, retryDelay * (attempt + 1)));
      }
    }
  }

  throw lastError || new ApiError("Request failed", 500);
}

export const api = {
  get: <T>(path: string, options?: ApiOptions) =>
    request<T>("GET", path, options),

  post: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>("POST", path, { ...options, body: body ? JSON.stringify(body) : undefined }),

  put: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>("PUT", path, { ...options, body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>("PATCH", path, { ...options, body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string, options?: ApiOptions) =>
    request<T>("DELETE", path, options),
};
