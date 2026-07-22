import type {
  ApiSuccessResponse,
  ApiListResponse,
  ApiCursorResponse,
  ApiErrorResponse,
  HttpStatusCode,
} from "../types";

function json<T>(data: T, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}

export function success<T>(data: T, status: HttpStatusCode = 200): Response {
  return json({ data } satisfies ApiSuccessResponse<T>, { status });
}

export function created<T>(data: T): Response {
  return json({ data } satisfies ApiSuccessResponse<T>, { status: 201 });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function list<T>(
  data: T[],
  count: number,
  page: number,
  pageSize: number
): Response {
  return json({
    data,
    count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  } satisfies ApiListResponse<T>);
}

export function cursor<T>(
  data: T[],
  nextCursor: string | null,
  hasMore: boolean
): Response {
  return json({ data, nextCursor, hasMore } satisfies ApiCursorResponse<T>);
}

export function error(
  message: string,
  status: HttpStatusCode = 500,
  code?: string,
  details?: unknown
): Response {
  return json({ error: message, code, details } satisfies ApiErrorResponse, { status });
}

export function badRequest(message = "Bad request", details?: unknown): Response {
  return error(message, 400, "BAD_REQUEST", details);
}

export function unauthorized(message = "Unauthorized"): Response {
  return error(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "Forbidden"): Response {
  return error(message, 403, "FORBIDDEN");
}

export function notFound(message = "Not found"): Response {
  return error(message, 404, "NOT_FOUND");
}

export function conflict(message = "Conflict", details?: unknown): Response {
  return error(message, 409, "CONFLICT", details);
}

export function rateLimited(message = "Too many requests", retryAfter?: number): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (retryAfter) headers["Retry-After"] = String(retryAfter);
  return new Response(
    JSON.stringify({ error: message, code: "RATE_LIMITED" } satisfies ApiErrorResponse),
    { status: 429, headers }
  );
}

export function serverError(message = "Internal server error", details?: unknown): Response {
  return error(message, 500, "INTERNAL_ERROR", details);
}

export function validationError(message: string, details?: unknown): Response {
  return error(message, 400, "VALIDATION_ERROR", details);
}