import { z } from "zod";

export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;

export const cursorPaginationParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type CursorPaginationParams = z.infer<typeof cursorPaginationParamsSchema>;

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ValidationError(first?.message || "Validation failed", result.error.issues);
  }
  return result.data;
}

export class ValidationError extends Error {
  public readonly issues: z.ZodIssue[];
  public readonly statusCode = 400;
  public readonly code = "VALIDATION_ERROR";

  constructor(message: string, issues: z.ZodIssue[]) {
    super(message);
    this.name = "ValidationError";
    this.issues = issues;
  }
}

export function parseQueryParams(searchParams: URLSearchParams): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  return params;
}