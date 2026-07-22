import { z } from "zod";
import { validationError } from "../response";

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw validationError(result.error.issues[0]?.message || "Validation failed", result.error.issues);
  }
  return result.data;
}

export function validatePartial<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  data: unknown
): Partial<Record<keyof T, unknown>> {
  const result = schema.partial().safeParse(data);
  if (!result.success) {
    throw validationError(result.error.issues[0]?.message || "Validation failed", result.error.issues);
  }
  return result.data as Partial<Record<keyof T, unknown>>;
}

export function parseQueryParams(request: Request, schema: z.ZodSchema): Record<string, unknown> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return validate(schema, params) as Record<string, unknown>;
}

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const cursorSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const filterSchema = z.object({
  category: z.string().optional(),
  location: z.string().optional(),
  deadline: z.string().optional(),
  verified: z.enum(["all", "true", "false"]).optional(),
  search: z.string().max(100).optional(),
}).passthrough();

export type PaginationParams = z.infer<typeof paginationSchema>;
export type CursorParams = z.infer<typeof cursorSchema>;
export type FilterParams = z.infer<typeof filterSchema>;

export function applyPagination(query: any, params: PaginationParams) {
  const start = (params.page - 1) * params.pageSize;
  return query.range(start, start + params.pageSize - 1);
}

export function applyCursor(query: any, params: CursorParams, cursorField = "created_at") {
  if (params.cursor) {
    const decoded = Buffer.from(params.cursor, "base64").toString("utf-8");
    if (params.order === "desc") {
      query = query.lt(cursorField, decoded);
    } else {
      query = query.gt(cursorField, decoded);
    }
  }
  return query.limit(params.limit + 1);
}

export function buildCursorResult<T>(
  data: T[],
  params: CursorParams,
  getCursor: (item: T) => string
): { data: T[]; nextCursor: string | null; hasMore: boolean } {
  const hasMore = data.length > params.limit;
  const items = hasMore ? data.slice(0, params.limit) : data;
  const nextCursor = hasMore && items.length > 0
    ? Buffer.from(getCursor(items[items.length - 1])).toString("base64")
    : null;
  return { data: items, nextCursor, hasMore };
}

export function applySort(query: any, sort?: string, order: "asc" | "desc" = "desc") {
  if (sort) return query.order(sort, { ascending: order === "asc" });
  return query;
}

export function applyFilters(query: any, filters: FilterParams) {
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.location) query = query.ilike("location", `%${filters.location}%`);
  if (filters.deadline) {
    const now = new Date().toISOString().split("T")[0];
    if (filters.deadline === "this_week") {
      const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      query = query.gte("deadline", now).lte("deadline", weekLater);
    } else if (filters.deadline === "this_month") {
      const monthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      query = query.gte("deadline", now).lte("deadline", monthLater);
    } else if (filters.deadline === "later") {
      const monthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      query = query.gt("deadline", monthLater);
    }
  }
  if (filters.verified === "true") {
    query = query.eq("verification_status", "verified");
  } else if (filters.verified === "all") {
    query = query.neq("verification_status", "pending");
  } else {
    query = query.eq("verification_status", "verified");
  }
  if (filters.search) {
    const clean = filters.search.replace(/[{}()"\\,.]/g, "").slice(0, 100);
    query = query.or(`title.ilike.%${clean}%,organization.ilike.%${clean}%,tags.cs.{"${clean}"}`);
  }
  return query;
}

export const opportunitySchema = z.object({
  title: z.string().min(3).max(300),
  organization: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  location: z.string().max(200).nullable().default(null),
  stipend: z.string().max(100).nullable().default(null),
  deadline: z.string().max(50).nullable().default(null),
  eligibility: z.string().max(500).nullable().default(null),
  description: z.string().max(5000).nullable().default(null),
  apply_link: z.string().url().max(1000).nullable().default(null),
  source_url: z.string().url().max(1000).nullable().default(null),
  source_type: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const opportunityListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  eligibility: z.string().optional(),
  location: z.string().optional(),
  deadline: z.string().optional(),
  verified: z.enum(["all", "true", "false"]).optional(),
  search: z.string().max(100).optional(),
});

export type OpportunityListQuery = z.infer<typeof opportunityListQuerySchema>;