import { describe, it, expect } from "@jest/globals";
import { success, created, noContent, list, badRequest, unauthorized, forbidden, notFound, serverError, validationError } from "../src/response";
import { handleError, ValidationError, AuthError, ForbiddenError, NotFoundError } from "../src/error";
import { createRateLimiter, rateLimitHeaders } from "../src/rate-limit";
import { cacheHeaders, noCache as noCacheHeaders, generateETag, checkETag } from "../src/cache";
import { generateOpenAPISpec } from "../src/openapi";

describe("Response helpers", () => {
  it("success() returns 200 with data", async () => {
    const res = success({ foo: "bar" });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    const body = await res.json();
    expect(body.data).toEqual({ foo: "bar" });
  });

  it("created() returns 201", async () => {
    const res = created({ id: 1 });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBe(1);
  });

  it("noContent() returns 204 with null body", () => {
    const res = noContent();
    expect(res.status).toBe(204);
  });

  it("list() returns paginated response", async () => {
    const res = list([{ id: 1 }], 1, 1, 20);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.count).toBe(1);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(20);
    expect(body.totalPages).toBe(1);
  });

  it("badRequest() returns 400", async () => {
    const res = badRequest("Invalid input");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid input");
    expect(body.code).toBe("BAD_REQUEST");
  });

  it("unauthorized() returns 401", async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("forbidden() returns 403", async () => {
    const res = forbidden();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("FORBIDDEN");
  });

  it("notFound() returns 404", async () => {
    const res = notFound();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("NOT_FOUND");
  });

  it("serverError() returns 500", async () => {
    const res = serverError();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("INTERNAL_ERROR");
  });

  it("validationError() returns 400 with details", async () => {
    const res = validationError("Title required", [{ field: "title" }]);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.details).toEqual([{ field: "title" }]);
  });
});

describe("Error handling", () => {
  it("handleError maps AppError subclasses correctly", () => {
    const tests = [
      { err: new ValidationError("Bad", { x: 1 }), status: 400, code: "VALIDATION_ERROR" },
      { err: new AuthError(), status: 401, code: "UNAUTHORIZED" },
      { err: new ForbiddenError("Nope"), status: 403, code: "FORBIDDEN" },
      { err: new NotFoundError(), status: 404, code: "NOT_FOUND" },
      { err: new Error("Generic"), status: 500, code: "INTERNAL_ERROR" },
      { err: "string error", status: 500, code: "UNKNOWN_ERROR" },
    ];

    for (const { err, status, code } of tests) {
      const result = handleError(err);
      expect(result.status).toBe(status);
      expect(result.body.code).toBe(code);
    }
  });
});

describe("Rate limiter", () => {
  it("createRateLimiter returns null on first request", async () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 5, keyPrefix: "test" });
    const result = await limiter(new Request("http://localhost"));
    expect(result).toBeNull();
  });

  it("rateLimitHeaders returns expected headers", () => {
    const headers = rateLimitHeaders({ windowMs: 60000, maxRequests: 100, keyPrefix: "test" }, 5);
    expect(headers["X-RateLimit-Limit"]).toBe("100");
    expect(headers["X-RateLimit-Remaining"]).toBe("95");
    expect(headers["X-RateLimit-Reset"]).toBeDefined();
  });
});

describe("Cache helpers", () => {
  it("cacheHeaders generates Cache-Control", () => {
    const h = cacheHeaders(3600, 600);
    expect(h["Cache-Control"]).toContain("max-age=3600");
    expect(h["Cache-Control"]).toContain("stale-while-revalidate=600");
  });

  it("noCacheHeaders disables caching", () => {
    const h = noCacheHeaders();
    expect(h["Cache-Control"]).toContain("no-store");
  });

  it("generateETag creates consistent tags", () => {
    const tag1 = generateETag({ a: 1 });
    const tag2 = generateETag({ a: 1 });
    const tag3 = generateETag({ a: 2 });
    expect(tag1).toBe(tag2);
    expect(tag1).not.toBe(tag3);
  });

  it("checkETag matches correctly", () => {
    const tag = generateETag("test");
    const req = new Request("http://localhost", { headers: { "if-none-match": tag } });
    expect(checkETag(req, tag)).toBe(true);
    expect(checkETag(new Request("http://localhost"), tag)).toBe(false);
  });
});

describe("OpenAPI spec", () => {
  it("generates valid spec", () => {
    const spec = generateOpenAPISpec();
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.info.title).toBe("BerojgarDegreeWala API");
    expect(Object.keys(spec.paths).length).toBeGreaterThan(30);
    expect(spec.components.schemas.Opportunity).toBeDefined();
    expect(spec.components.schemas.Organization).toBeDefined();
    expect(spec.components.schemas.OpportunityListResponse).toBeDefined();
    expect(spec.components.securitySchemes.BearerAuth).toBeDefined();
    expect(spec.components.securitySchemes.AdminAuth).toBeDefined();
    expect(spec.components.securitySchemes.CronAuth).toBeDefined();
    expect(spec.tags.length).toBeGreaterThan(10);
  });

  it("all paths have at least one operation", () => {
    const spec = generateOpenAPISpec();
    for (const [path, item] of Object.entries(spec.paths)) {
      const ops = ["get", "post", "put", "patch", "delete"] as const;
      const hasOp = ops.some((op) => item[op] !== undefined);
      expect(hasOp).toBe(true);
    }
  });

  it("refs point to valid schemas", () => {
    const spec = generateOpenAPISpec();
    const schemaNames = new Set(Object.keys(spec.components.schemas));

    function checkRef(obj: any) {
      if (!obj || typeof obj !== "object") return;
      if (obj.$ref) {
        const refName = obj.$ref.replace("#/components/schemas/", "");
        expect(schemaNames.has(refName)).toBe(true);
      }
      for (const val of Object.values(obj)) {
        checkRef(val);
      }
    }

    for (const pathItem of Object.values(spec.paths)) {
      checkRef(pathItem);
    }
  });
});
