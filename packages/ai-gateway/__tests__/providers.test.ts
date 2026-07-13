import {
  isProviderAvailable,
  getAvailableProviders,
  PROVIDER_ORDER,
  PROVIDER_ENV_KEYS,
  PROVIDER_EXTRA_ENV,
  PROVIDER_MODELS,
  AIProviderName,
} from "../src/index";

describe("isProviderAvailable", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Set all AI provider keys
    process.env.GROQ_API_KEY = "grok-key";
    process.env.OPENROUTER_API_KEY = "or-key";
    process.env.CLOUDFLARE_AI_TOKEN = "cf-key";
    process.env.CLOUDFLARE_ACCOUNT_ID = "cf-account";
    process.env.GEMINI_API_KEY = "gem-key";
    process.env.NVIDIA_NIM_API_KEY = "nv-key";
    process.env.AWS_BEARER_TOKEN_BEDROCK = "aws-key";
    process.env.HUGGINGFACE_API_KEY = "hf-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns true when provider key is set", () => {
    expect(isProviderAvailable("groq")).toBe(true);
  });

  it("returns false when provider key is missing", () => {
    delete process.env.GROQ_API_KEY;
    expect(isProviderAvailable("groq")).toBe(false);
  });

  it("returns false when extra env var is missing", () => {
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    expect(isProviderAvailable("cloudflare")).toBe(false);
  });

  it("returns true for providers without extra env requirements", () => {
    expect(isProviderAvailable("openrouter")).toBe(true);
    expect(isProviderAvailable("gemini")).toBe(true);
  });

  it("handles bedrock provider", () => {
    expect(isProviderAvailable("bedrock")).toBe(true);
    delete process.env.AWS_BEARER_TOKEN_BEDROCK;
    expect(isProviderAvailable("bedrock")).toBe(false);
  });

  it("handles huggingface provider", () => {
    expect(isProviderAvailable("huggingface")).toBe(true);
    delete process.env.HUGGINGFACE_API_KEY;
    expect(isProviderAvailable("huggingface")).toBe(false);
  });
});

describe("getAvailableProviders", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.GROQ_API_KEY = "grok-key";
    process.env.OPENROUTER_API_KEY = "or-key";
    process.env.CLOUDFLARE_AI_TOKEN = "cf-key";
    process.env.CLOUDFLARE_ACCOUNT_ID = "cf-account";
    process.env.GEMINI_API_KEY = "gem-key";
    process.env.NVIDIA_NIM_API_KEY = "nv-key";
    process.env.AWS_BEARER_TOKEN_BEDROCK = "aws-key";
    process.env.HUGGINGFACE_API_KEY = "hf-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns all 7 providers when all keys are set", () => {
    const available = getAvailableProviders();
    expect(available).toHaveLength(7);
    expect(available).toEqual(PROVIDER_ORDER);
  });

  it("returns providers in correct fallback order", () => {
    const available = getAvailableProviders();
    expect(available[0]).toBe("groq");
    expect(available[1]).toBe("openrouter");
    expect(available[2]).toBe("cloudflare");
    expect(available[3]).toBe("gemini");
    expect(available[4]).toBe("nvidia");
    expect(available[5]).toBe("bedrock");
    expect(available[6]).toBe("huggingface");
  });

  it("excludes providers with missing keys", () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.HUGGINGFACE_API_KEY;
    const available = getAvailableProviders();
    expect(available).not.toContain("groq");
    expect(available).not.toContain("huggingface");
    expect(available.length).toBe(5);
  });
});

describe("PROVIDER_MODELS", () => {
  it("has a model for every provider", () => {
    for (const name of PROVIDER_ORDER) {
      expect(PROVIDER_MODELS[name]).toBeDefined();
      expect(typeof PROVIDER_MODELS[name]).toBe("string");
      expect(PROVIDER_MODELS[name].length).toBeGreaterThan(0);
    }
  });
});

describe("PROVIDER_ENV_KEYS", () => {
  it("has an env key for every provider", () => {
    for (const name of PROVIDER_ORDER) {
      expect(PROVIDER_ENV_KEYS[name]).toBeDefined();
      expect(typeof PROVIDER_ENV_KEYS[name]).toBe("string");
      expect(PROVIDER_ENV_KEYS[name].length).toBeGreaterThan(0);
    }
  });
});
