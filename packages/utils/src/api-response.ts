import { AppError } from "./index";

export interface SuccessResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return { data };
}

export function createPaginatedResponse<T>(
  data: T[],
  count: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  return { data, count, page, pageSize };
}

export function createErrorResponse(
  error: unknown,
  includeDetails = false
): ErrorResponse {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      details: includeDetails ? error.details : undefined,
    };
  }
  if (error instanceof Error) {
    return {
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "An unexpected error occurred",
    };
  }
  return { error: "An unexpected error occurred" };
}

export function getStatusFromError(error: unknown): number {
  if (error instanceof AppError) return error.statusCode;
  return 500;
}
