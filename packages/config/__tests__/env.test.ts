import { validateEnv, requireEnv, CATEGORIES, VERIFICATION_STATUS_VALUES } from "../src/index";

describe("validateEnv", () => {
  it("returns empty object for empty input", () => {
    const result = validateEnv({});
    expect(result).toBeDefined();
  });

  it("validates valid env vars", () => {
    const result = validateEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "some-key",
    });
    expect(result).toBeDefined();
  });

  it("validates all database URLs", () => {
    const result = validateEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://db1.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "svc-key",
      SUPABASE_2_URL: "https://db2.supabase.co",
      SUPABASE_2_SERVICE_ROLE_KEY: "svc-key-2",
      NEON_1_DATABASE_URL: "postgres://neon1",
      NEON_2_DATABASE_URL: "postgres://neon2",
    });
    expect(result.NEXT_PUBLIC_SUPABASE_URL).toBe("https://db1.supabase.co");
    expect(result.NEON_1_DATABASE_URL).toBe("postgres://neon1");
  });

  it("validates all AI provider keys", () => {
    const result = validateEnv({
      GROQ_API_KEY: "grok-key",
      OPENROUTER_API_KEY: "or-key",
      CLOUDFLARE_AI_TOKEN: "cf-token",
      CLOUDFLARE_ACCOUNT_ID: "cf-acc",
      GEMINI_API_KEY: "gem-key",
      NVIDIA_NIM_API_KEY: "nv-key",
      AWS_BEARER_TOKEN_BEDROCK: "aws-token",
      HUGGINGFACE_API_KEY: "hf-key",
    });
    expect(result.GROQ_API_KEY).toBe("grok-key");
    expect(result.HUGGINGFACE_API_KEY).toBe("hf-key");
  });

  it("validates security-related env vars", () => {
    const result = validateEnv({
      ADMIN_PASSWORD: "admin-pass",
      CRON_SECRET: "cron-secret",
      SCRAPER_SECRET: "scraper-secret",
    });
    expect(result.ADMIN_PASSWORD).toBe("admin-pass");
    expect(result.CRON_SECRET).toBe("cron-secret");
    expect(result.SCRAPER_SECRET).toBe("scraper-secret");
  });

  it("validates optional env vars", () => {
    const result = validateEnv({
      ALLOWED_ORIGINS: "*",
      PORT: "3000",
      LOG_LEVEL: "DEBUG",
    });
    expect(result.ALLOWED_ORIGINS).toBe("*");
    expect(result.PORT).toBe("3000");
    expect(result.LOG_LEVEL).toBe("DEBUG");
  });

  it("rejects invalid LOG_LEVEL", () => {
    const result = validateEnv({ LOG_LEVEL: "INVALID" });
    expect(result.LOG_LEVEL).toBeUndefined();
  });

  it("rejects invalid URL format", () => {
    const result = validateEnv({
      NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
    });
    expect(result.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
  });
});

describe("requireEnv", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns value when env var exists", () => {
    process.env.TEST_VAR = "test-value";
    expect(requireEnv("TEST_VAR")).toBe("test-value");
  });

  it("throws when env var is missing", () => {
    delete process.env.NONEXISTENT_VAR;
    expect(() => requireEnv("NONEXISTENT_VAR")).toThrow(
      "Missing required environment variable: NONEXISTENT_VAR"
    );
  });
});

describe("CATEGORIES", () => {
  it("includes all expected categories", () => {
    expect(CATEGORIES).toContain("jrf");
    expect(CATEGORIES).toContain("phd");
    expect(CATEGORIES).toContain("internship");
    expect(CATEGORIES).toContain("srf");
    expect(CATEGORIES).toContain("govt-job");
    expect(CATEGORIES).toContain("fellowship");
    expect(CATEGORIES).toContain("private");
    expect(CATEGORIES).toContain("postdoc");
    expect(CATEGORIES).toContain("international");
  });
});

describe("VERIFICATION_STATUS_VALUES", () => {
  it("matches the spec exactly", () => {
    expect(VERIFICATION_STATUS_VALUES).toEqual([
      "verified",
      "pending",
      "rejected",
      "expired",
      "link_unavailable",
    ]);
  });
});
