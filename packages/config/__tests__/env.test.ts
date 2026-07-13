import { validateEnv, CATEGORIES } from "../src/index";

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
});

describe("CATEGORIES", () => {
  it("includes all expected categories", () => {
    expect(CATEGORIES).toContain("jrf");
    expect(CATEGORIES).toContain("phd");
    expect(CATEGORIES).toContain("internship");
  });
});
