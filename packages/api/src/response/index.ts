import { NextResponse } from "next/server";

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiListSuccess<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiCursorSuccess<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiListSuccess<T> | ApiCursorSuccess<T> | ApiErrorResponse;

export function success<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data }, { status: 201 });
}

export function listSuccess<T>(
  data: T[],
  count: number,
  page: number,
  pageSize: number
): NextResponse<ApiListSuccess<T>> {
  const totalPages = Math.ceil(count / pageSize);
  return NextResponse.json({
    data,
    count,
    page,
    pageSize,
    totalPages,
  });
}

export function cursorSuccess<T>(
  data: T[],
  nextCursor: string | null,
  hasMore: boolean
): NextResponse<ApiCursorSuccess<T>> {
  return NextResponse.json({ data, nextCursor, hasMore });
}

export function noContent(): NextResponse<null> {
  return new NextResponse(null, { status: 204 });
}

export function error(message: string, status = 500, code?: string, details?: unknown): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { error: message, code, details },
    { status }
  );
}

export function badRequest(message: string, details?: unknown): NextResponse<ApiErrorResponse> {
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

export function conflict(message: string, details?: unknown): NextResponse<ApiErrorResponse> {
  return error(message, 409, "CONFLICT", details);
}

export function rateLimited(message = "Too many requests"): NextResponse<ApiErrorResponse> {
  return error(message, 429, "RATE_LIMITED");
}

export function serverError(message = "Internal server error", details?: unknown): NextResponse<ApiErrorResponse> {
  return error(message, 500, "INTERNAL_ERROR", details);
}

export function validationError(message: string, details?: unknown): NextResponse<ApiErrorResponse> {
  return error(message, 400, "VALIDATION_ERROR", details);
}