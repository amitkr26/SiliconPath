import {
  getDaysUntilDeadline,
  isExpired,
  getDaysAgo,
  isNew,
  formatDate,
  sanitizeSearchInput,
  validateUrl,
  slugify,
  AppError,
  NotFoundError,
  ValidationError,
  AuthError,
  ForbiddenError,
  formatError,
} from "../src/index";

describe("getDaysUntilDeadline", () => {
  it("returns positive days for future date", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(getDaysUntilDeadline(future.toISOString())).toBeGreaterThan(0);
  });

  it("returns negative days for past date", () => {
    const past = new Date("2020-01-01");
    expect(getDaysUntilDeadline(past.toISOString())).toBeLessThan(0);
  });
});

describe("isExpired", () => {
  it("returns true for past date", () => {
    expect(isExpired("2020-01-01")).toBe(true);
  });

  it("returns false for future date", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isExpired(future.toISOString())).toBe(false);
  });
});

describe("getDaysAgo", () => {
  it('returns "Today" for current date', () => {
    expect(getDaysAgo(new Date().toISOString())).toBe("Today");
  });

  it('returns "Yesterday" for one day ago', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getDaysAgo(yesterday.toISOString())).toBe("Yesterday");
  });
});

describe("isNew", () => {
  it("returns true for recent date", () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 2);
    expect(isNew(recent.toISOString())).toBe(true);
  });

  it("returns false for old date", () => {
    const old = new Date("2020-01-01");
    expect(isNew(old.toISOString())).toBe(false);
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2024-01-15");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });
});

describe("sanitizeSearchInput", () => {
  it("removes PostgREST metacharacters", () => {
    expect(sanitizeSearchInput("hello{world}")).toBe("helloworld");
  });

  it("trims whitespace", () => {
    expect(sanitizeSearchInput("  hello  ")).toBe("hello");
  });

  it("caps at 100 characters", () => {
    const long = "a".repeat(200);
    expect(sanitizeSearchInput(long).length).toBe(100);
  });
});

describe("validateUrl", () => {
  it("accepts valid https URL", () => {
    expect(validateUrl("https://example.com")).toBe(true);
  });

  it("rejects localhost", () => {
    expect(validateUrl("http://localhost:3000")).toBe(false);
  });

  it("rejects private IP ranges", () => {
    expect(validateUrl("http://192.168.1.1")).toBe(false);
    expect(validateUrl("http://10.0.0.1")).toBe(false);
    expect(validateUrl("http://127.0.0.1")).toBe(false);
  });

  it("rejects metadata endpoints", () => {
    expect(validateUrl("http://metadata.google.internal")).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(validateUrl("not-a-url")).toBe(false);
  });
});

describe("slugify", () => {
  it("converts text to URL-friendly slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! @World#")).toBe("hello-world");
  });
});

describe("AppError", () => {
  it("creates error with status code", () => {
    const error = new AppError("Test error", 400, "TEST_CODE");
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("TEST_CODE");
  });
});

describe("NotFoundError", () => {
  it("creates 404 error with resource name", () => {
    const error = new NotFoundError("User", "123");
    expect(error.statusCode).toBe(404);
    expect(error.message).toContain("User");
    expect(error.message).toContain("123");
  });
});

describe("ValidationError", () => {
  it("creates 400 error", () => {
    const error = new ValidationError("Invalid input");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
  });
});

describe("AuthError", () => {
  it("creates 401 error", () => {
    const error = new AuthError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
  });
});

describe("ForbiddenError", () => {
  it("creates 403 error", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });
});

describe("formatError", () => {
  it("formats AppError with code", () => {
    const error = new NotFoundError("User");
    const result = formatError(error);
    expect(result.status).toBe(404);
    expect(result.code).toBe("NOT_FOUND");
  });

  it("formats generic Error as 500", () => {
    const result = formatError(new Error("Something broke"));
    expect(result.status).toBe(500);
  });

  it("hides error message in production", () => {
    const orig = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const result = formatError(new Error("Secret details"));
    expect(result.message).toBe("An unexpected error occurred");
    process.env.NODE_ENV = orig;
  });
});
