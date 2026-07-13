import { NextRequest } from "next/server";
import { z } from "zod";

export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;

export const cursorParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type CursorParams = z.infer<typeof cursorParamsSchema>;

export function parsePagination(request: NextRequest): PaginationParams {
  const searchParams = new URL(request.url).searchParams;
  return paginationParamsSchema.parse(Object.fromEntries(searchParams));
}

export function parseCursor(request: NextRequest): CursorParams {
  const searchParams = new URL(request.url).searchParams;
  return cursorParamsSchema.parse(Object.fromEntries(searchParams));
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CursorResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function buildPaginatedResult<T>(
  data: T[],
  count: number,
  params: PaginationParams
): PaginatedResult<T> {
  return {
    data,
    count,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(count / params.pageSize),
  };
}

export function buildCursorResult<T>(
  data: T[],
  params: CursorParams,
  getCursor: (item: T) => string
): CursorResult<T> {
  const hasMore = data.length > params.limit;
  const items = hasMore ? data.slice(0, params.limit) : data;
  const nextCursor = hasMore && items.length > 0
    ? Buffer.from(getCursor(items[items.length - 1])).toString("base64")
    : null;
  return { data: items, nextCursor, hasMore };
}

export function applySort<T extends Record<string, unknown>>(
  query: any,
  sort?: string,
  order: "asc" | "desc" = "desc"
): any {
  if (sort) {
    return query.order(sort, { ascending: order === "asc" });
  }
  return query;
}

export function applyCursor<T>(
  query: any,
  cursor: string | undefined,
  cursorField: string,
  order: "asc" | "desc" = "desc"
): any {
  if (cursor) {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    if (order === "desc") {
      return query.lt(cursorField, decoded);
    }
    return query.gt(cursorField, decoded);
  }
  return query;
}