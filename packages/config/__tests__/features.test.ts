import { FEATURES } from "../src/index";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

function clearAIKeys() {
  delete process.env.GROQ_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.CLOUDFLARE_AI_TOKEN;
  delete process.env.GEMINI_API_KEY;
  delete process.env.NVIDIA_NIM_API_KEY;
  delete process.env.AWS_BEARER_TOKEN_BEDROCK;
  delete process.env.HUGGINGFACE_API_KEY;
}

describe("FEATURES.AI_CHAT_ENABLED", () => {
  it("is false when no AI keys are set", () => {
    clearAIKeys();
    jest.resetModules();
    const { FEATURES: f } = jest.requireActual("../src/index");
    expect(f.AI_CHAT_ENABLED).toBe(false);
  });

  it("is true when GROQ_API_KEY is set", () => {
    clearAIKeys();
    process.env.GROQ_API_KEY = "gk-test";
    jest.resetModules();
    const { FEATURES: f } = jest.requireActual("../src/index");
    expect(f.AI_CHAT_ENABLED).toBe(true);
  });

  it("is true when OPENROUTER_API_KEY is set", () => {
    clearAIKeys();
    process.env.OPENROUTER_API_KEY = "or-test";
    jest.resetModules();
    const { FEATURES: f } = jest.requireActual("../src/index");
    expect(f.AI_CHAT_ENABLED).toBe(true);
  });

  it("is true when HUGGINGFACE_API_KEY is set", () => {
    clearAIKeys();
    process.env.HUGGINGFACE_API_KEY = "hf-test";
    jest.resetModules();
    const { FEATURES: f } = jest.requireActual("../src/index");
    expect(f.AI_CHAT_ENABLED).toBe(true);
  });

  it("is true when GEMINI_API_KEY is set", () => {
    clearAIKeys();
    process.env.GEMINI_API_KEY = "gm-test";
    jest.resetModules();
    const { FEATURES: f } = jest.requireActual("../src/index");
    expect(f.AI_CHAT_ENABLED).toBe(true);
  });

  it("is true when NVIDIA_NIM_API_KEY is set", () => {
    clearAIKeys();
    process.env.NVIDIA_NIM_API_KEY = "nv-test";
    jest.resetModules();
    const { FEATURES: f } = jest.requireActual("../src/index");
    expect(f.AI_CHAT_ENABLED).toBe(true);
  });

  it("is true when AWS_BEARER_TOKEN_BEDROCK is set", () => {
    clearAIKeys();
    process.env.AWS_BEARER_TOKEN_BEDROCK = "aws-test";
    jest.resetModules();
    const { FEATURES: f } = jest.requireActual("../src/index");
    expect(f.AI_CHAT_ENABLED).toBe(true);
  });

  it("is true when CLOUDFLARE_AI_TOKEN is set", () => {
    clearAIKeys();
    process.env.CLOUDFLARE_AI_TOKEN = "cf-test";
    jest.resetModules();
    const { FEATURES: f } = jest.requireActual("../src/index");
    expect(f.AI_CHAT_ENABLED).toBe(true);
  });
});

describe("FEATURES.AI_MATCH_ENABLED", () => {
  it("is true when any single AI key is set", () => {
    clearAIKeys();
    process.env.GROQ_API_KEY = "gk-test";
    jest.resetModules();
    const { FEATURES: f } = jest.requireActual("../src/index");
    expect(f.AI_MATCH_ENABLED).toBe(true);
  });
});

describe("FEATURES.AI_SEARCH_ENABLED", () => {
  it("is true when any single AI key is set", () => {
    clearAIKeys();
    process.env.GROQ_API_KEY = "gk-test";
    jest.resetModules();
    const { FEATURES: f } = jest.requireActual("../src/index");
    expect(f.AI_SEARCH_ENABLED).toBe(true);
  });
});

describe("FEATURES.RESUME_ENABLED", () => {
  it("is always true", () => {
    expect(FEATURES.RESUME_ENABLED).toBe(true);
  });
});

describe("FEATURES.TELEGRAM_ENABLED", () => {
  it("is true when both telegram vars are set", () => {
    process.env.TELEGRAM_BOT_TOKEN = "bot:token";
    process.env.TELEGRAM_CHANNEL_ID = "@channel";
    jest.resetModules();
    const { FEATURES: f } = jest.requireActual("../src/index");
    expect(f.TELEGRAM_ENABLED).toBe(true);
  });

  it("is false when telegram vars are missing", () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHANNEL_ID;
    jest.resetModules();
    const { FEATURES: f } = jest.requireActual("../src/index");
    expect(f.TELEGRAM_ENABLED).toBe(false);
  });
});

describe("FEATURES.EMAIL_DIGEST_ENABLED", () => {
  it("is true when RESEND_API_KEY is set", () => {
    process.env.RESEND_API_KEY = "re_xxx";
    jest.resetModules();
    const { FEATURES: f } = jest.requireActual("../src/index");
    expect(f.EMAIL_DIGEST_ENABLED).toBe(true);
  });

  it("is false when RESEND_API_KEY is missing", () => {
    delete process.env.RESEND_API_KEY;
    jest.resetModules();
    const { FEATURES: f } = jest.requireActual("../src/index");
    expect(f.EMAIL_DIGEST_ENABLED).toBe(false);
  });
});
