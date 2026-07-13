import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CursorResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

export function success<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, { status: 201 });
}

export function noContent(): NextResponse<null> {
  return new NextResponse(null, { status: 204 });
}

export function paginated<T>(
  data: T[],
  count: number,
  page: number,
  pageSize: number
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json({
    data,
    count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  });
}

export function cursorPaginated<T>(
  data: T[],
  nextCursor: string | null,
  hasMore: boolean
): NextResponse<CursorResponse<T>> {
  return NextResponse.json({ data, nextCursor, hasMore });
}

export function error(
  message: string,
  status = 400,
  code?: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { error: message, code, details },
    { status }
  );
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

export function conflict(message = "Conflict"): NextResponse<ApiErrorResponse> {
  return error(message, 409, "CONFLICT");
}

export function tooManyRequests(message = "Too many requests", retryAfter?: number): NextResponse<ApiErrorResponse> {
  const headers: Record<string, string> = {};
  if (retryAfter) headers["Retry-After"] = String(retryAfter);
  return NextResponse.json(
    { error: message, code: "RATE_LIMITED" },
    { status: 429, headers }
  );
}

export function internalError(message = "Internal server error", details?: unknown): NextResponse<ApiErrorResponse> {
  return error(message, 500, "INTERNAL_ERROR", details);
}

export function fromZodError(zodError: ZodError): NextResponse<ApiErrorResponse> {
  const first = zodError.issues[0];
  return badRequest(first?.message || "Validation failed", zodError.issues);
}

export function handleError(err: unknown): NextResponse<ApiErrorResponse> {
  if (err instanceof ZodError) return fromZodError(err);
  if (err instanceof Error) return internalError(err.message);
  return internalError("Unknown error");
}