export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiCursorResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T> =
  | ApiSuccessResponse<T>
  | ApiListResponse<T>
  | ApiCursorResponse<T>
  | ApiErrorResponse;

export type HttpStatusCode =
  | 200
  | 201
  | 204
  | 400
  | 401
  | 403
  | 404
  | 409
  | 429
  | 500;

export interface PaginationParams {
  page: number;
  pageSize: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface CursorParams {
  cursor?: string;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface FilterParams {
  category?: string;
  location?: string;
  deadline?: string;
  verified?: "all" | "true" | "false";
  search?: string;
  [key: string]: unknown;
}

export interface RequestContext {
  userId?: string;
  isAdmin?: boolean;
  isCron?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}