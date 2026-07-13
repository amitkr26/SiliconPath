import { NextResponse } from "next/server";
import type {
  ApiSuccessResponse,
  ApiListResponse,
  ApiCursorResponse,
  ApiErrorResponse,
  HttpStatusCode,
} from "../types";

export function success<T>(data: T, status: HttpStatusCode = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data }, { status: 201 });
}

export function noContent(): NextResponse<null> {
  return new NextResponse(null, { status: 204 });
}

export function list<T>(
  data: T[],
  count: number,
  page: number,
  pageSize: number
): NextResponse<ApiListResponse<T>> {
  return NextResponse.json({
    data,
    count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  });
}

export function cursor<T>(
  data: T[],
  nextCursor: string | null,
  hasMore: boolean
): NextResponse<ApiCursorResponse<T>> {
  return NextResponse.json({ data, nextCursor, hasMore });
}

export function error(
  message: string,
  status: HttpStatusCode = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error: message, code, details }, { status });
}

export function badRequest(message = "Bad request", details?: unknown): NextResponse<ApiErrorResponse> {
  return error(message, 400, "BAD_REQUEST", details);
}

export function unauthorized(message = "Unauthorized"): NextResponse<ApiErrorResponse> {
  return error(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "Forbidden"): NextResponse<ApiErrorResponse> {
  return error(message, 403, "FORBIDDEN");
}

export function notFound(message = "Not found"): NextResponse<ApiErrorResponse> {
  return error(message, 404, "NOT_FOUND");
}

export function conflict(message = "Conflict", details?: unknown): NextResponse<ApiErrorResponse> {
  return error(message, 409, "CONFLICT", details);
}

export function rateLimited(message = "Too many requests", retryAfter?: number): NextResponse<ApiErrorResponse> {
  const headers: Record<string, string> = {};
  if (retryAfter) headers["Retry-After"] = String(retryAfter);
  return new NextResponse(
    JSON.stringify({ error: message, code: "RATE_LIMITED" }),
    { status: 429, headers }
  );
}

export function serverError(message = "Internal server error", details?: unknown): NextResponse<ApiErrorResponse> {
  return error(message, 500, "INTERNAL_ERROR", details);
}

export function validationError(message: string, details?: unknown): NextResponse<ApiErrorResponse> {
  return error(message, 400, "VALIDATION_ERROR", details);
}