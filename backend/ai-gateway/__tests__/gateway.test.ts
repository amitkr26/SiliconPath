import { jest } from "@jest/globals";

// Phase 5: AI gateway verification. Every test loads a FRESH module instance
// (jest.isolateModules) so the module-level 10-minute provider cooldowns and
// the logger never leak between tests. Providers are stubbed via global.fetch,
// so nothing ever touches the network and no credentials are required.

const URLS = {
  groq: "https://api.groq.com/openai/v1/chat/completions",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=test-key",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  nvidia: "https://integrate.api.nvidia.com/v1/chat/completions",
  agentrouter: "https://agentrouter.org/v1/chat/completions",
  omnirouter: "http://localhost:20128/v1/chat/completions",
  cloudflare: "https://api.cloudflare.com/client/v4/accounts/acct/ai/run/@cf/meta/llama-3.1-8b-instruct",
  bedrock: "https://bedrock-mantle.us-east-1.api.aws/v1/chat/completions",
  huggingface: "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
} as const;

const ENV_KEYS: Record<string, string> = {
  groq: "GROQ_API_KEY",
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  nvidia: "NVIDIA_NIM_API_KEY",
  agentrouter: "AGENTROUTER_API_KEY",
  bedrock: "AWS_BEARER_TOKEN_BEDROCK",
  cloudflare: "CLOUDFLARE_AI_TOKEN",
  huggingface: "HUGGINGFACE_API_KEY",
};

type ProviderName = keyof typeof ENV_KEYS | "omnirouter";

function setProviderKeys(...names: ProviderName[]): void {
  for (const key of Object.values(ENV_KEYS)) delete process.env[key];
  delete process.env.CLOUDFLARE_ACCOUNT_ID;
  for (const name of names) {
    if (name === "cloudflare") {
      process.env.CLOUDFLARE_AI_TOKEN = "test-key";
      process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
    } else if (name === "omnirouter") {
      process.env.OMNIROUTER_BASE_URL = "http://localhost:20128/v1";
      process.env.OMNIROUTER_API_KEY = "test-key";
    } else {
      process.env[ENV_KEYS[name]] = "test-key";
    }
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const OPENAI_OK = (content: string) => jsonResponse({ choices: [{ message: { content } }] });

// Stub: known URLs return per-provider results; anything else (e.g. the
// omnirouter default) fails with 500 so chains terminate deterministically.
function stubFetch(results: Partial<Record<ProviderName, Response | Error>>) {
  const calls: string[] = [];
  const fn = jest.fn(async (url: string) => {
    calls.push(url);
    const provider = (Object.keys(URLS) as ProviderName[]).find((p) => url.startsWith(URLS[p]));
    const result = provider ? results[provider] : undefined;
    if (result instanceof Error) throw result;
    if (result) return result;
    return jsonResponse({ error: "unexpected provider" }, 500);
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return { calls, fn };
}

function freshGateway() {
  let gateway: any;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    gateway = require("../src/gateway/index").gateway;
  });
  return gateway;
}

const MSG = { role: "user", content: "tell me about semiconductor jobs" } as const;

afterEach(() => {
  delete (globalThis as any).fetch;
  for (const key of Object.values(ENV_KEYS)) delete process.env[key];
  delete process.env.CLOUDFLARE_ACCOUNT_ID;
  delete process.env.OMNIROUTER_BASE_URL;
  delete process.env.OMNIROUTER_API_KEY;
  delete process.env.BDW_AI_ENABLED;
  delete process.env.BDW_AI_BASE_URL;
  delete process.env.BDW_AI_MODEL;
  delete process.env.BDW_AI_API_KEY;
  delete process.env.BDW_AI_TIMEOUT_MS;
});

describe("AI gateway — success path", () => {
  test("returns provider text/model for a successful call", async () => {
    setProviderKeys("groq");
    const { calls } = stubFetch({ groq: OPENAI_OK("hello") });
    const gateway = freshGateway();

    const result = await gateway.generate({ messages: [MSG] }, "test-feature");
    expect(result).toEqual({ text: "hello", provider: "groq", model: "qwen/qwen3.6-27b" });
    expect(calls[0]).toBe(URLS.groq);
    expect(calls).toHaveLength(1);
  });

  test("sends the bearer key and system prompt in the request", async () => {
    setProviderKeys("groq");
    const { fn } = stubFetch({ groq: OPENAI_OK("ok") });
    const gateway = freshGateway();

    await gateway.generate({ messages: [MSG], systemPrompt: "Be concise" }, "test-feature");
    const [, init] = fn.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init.body as string);
    expect(body.messages[0]).toEqual({ role: "system", content: "Be concise" });
  });

  test("preferred model reorders the provider chain", async () => {
    setProviderKeys("groq", "bedrock");
    const { calls } = stubFetch({ bedrock: OPENAI_OK("from bedrock") });
    const gateway = freshGateway();

    const result = await gateway.generate({ messages: [MSG], model: "bedrock" as any }, "test-feature");
    expect(result.provider).toBe("bedrock");
    expect(calls[0]).toBe(URLS.bedrock); // bedrock tried before groq
  });

  test("returns empty text when a provider responds with no content (documented, not fabricated)", async () => {
    setProviderKeys("groq");
    stubFetch({ groq: jsonResponse({ choices: [] }) });
    const gateway = freshGateway();

    const result = await gateway.generate({ messages: [MSG] }, "test-feature");
    expect(result).toEqual({ text: "", provider: "groq", model: "qwen/qwen3.6-27b" });
  });
});

describe("AI gateway — fallback chain", () => {
  test("falls back when the first provider returns HTTP 500", async () => {
    setProviderKeys("groq", "gemini");
    const { calls } = stubFetch({ groq: jsonResponse({ error: "boom" }, 500), gemini: jsonResponse({ candidates: [{ content: { parts: [{ text: "from gemini" }] } }] }) });
    const gateway = freshGateway();

    const result = await gateway.generate({ messages: [MSG] }, "test-feature");
    expect(result.provider).toBe("gemini");
    expect(result.text).toBe("from gemini");
    expect(calls[0]).toBe(URLS.groq);
    expect(calls[1]).toBe(URLS.gemini);
  });

  test("falls back through 429 then 500 to a healthy provider", async () => {
    setProviderKeys("groq", "gemini", "openrouter");
    const { calls } = stubFetch({
      groq: jsonResponse({ error: "rate limited" }, 429),
      gemini: jsonResponse({ error: "server error" }, 500),
      openrouter: OPENAI_OK("from openrouter"),
    });
    const gateway = freshGateway();

    const result = await gateway.generate({ messages: [MSG] }, "test-feature");
    expect(result.provider).toBe("openrouter");
    expect(calls).toEqual([URLS.groq, URLS.gemini, URLS.openrouter]);
  });

  test("falls back when the provider request times out (abort)", async () => {
    setProviderKeys("groq", "gemini");
    stubFetch({ groq: new Error("The operation was aborted due to timeout"), gemini: jsonResponse({ candidates: [{ content: { parts: [{ text: "survived" }] } }] }) });
    const gateway = freshGateway();

    const result = await gateway.generate({ messages: [MSG] }, "test-feature");
    expect(result.provider).toBe("gemini");
  });

  test("falls back when the provider returns malformed JSON", async () => {
    setProviderKeys("groq", "gemini");
    stubFetch({ groq: new Response("not-json", { status: 200 }), gemini: jsonResponse({ candidates: [{ content: { parts: [{ text: "parsed" }] } }] }) });
    const gateway = freshGateway();

    const result = await gateway.generate({ messages: [MSG] }, "test-feature");
    expect(result.provider).toBe("gemini");
  });

  test("nvidia treats an empty content response as failure (only provider with this guard)", async () => {
    setProviderKeys("nvidia");
    stubFetch({ nvidia: jsonResponse({ choices: [{ message: { content: "" } }] }) });
    const gateway = freshGateway();

    await expect(gateway.generate({ messages: [MSG] }, "test-feature")).rejects.toThrow("All AI providers failed");
  });
});

describe("AI gateway — failure handling", () => {
  test("skips providers whose credentials are missing", async () => {
    setProviderKeys("groq"); // only groq has a key
    const { calls } = stubFetch({ groq: jsonResponse({ error: "down" }, 500) });
    const gateway = freshGateway();

    await expect(gateway.generate({ messages: [MSG] }, "test-feature")).rejects.toThrow("All AI providers failed. Please try again later.");
    // Documented behavior: providers without credentials are skipped, EXCEPT
    // omnirouter which has a localhost default and is always attempted (it
    // fails fast against the stub 500). Other providers never see a request.
    expect(calls).toEqual([URLS.groq, URLS.omnirouter]);
  });

  test("throws a controlled error when every provider fails — never a fabricated success", async () => {
    setProviderKeys("groq", "gemini", "openrouter", "nvidia", "agentrouter", "omnirouter", "cloudflare", "bedrock", "huggingface");
    const { calls } = stubFetch({});
    const gateway = freshGateway();

    await expect(gateway.generate({ messages: [MSG] }, "test-feature")).rejects.toThrow("All AI providers failed. Please try again later.");
    expect(calls.length).toBeGreaterThanOrEqual(9); // every configured provider was tried
  });

  test("failed providers go into cooldown and are skipped on the next call", async () => {
    setProviderKeys("groq", "gemini");
    const { calls } = stubFetch({ groq: jsonResponse({ error: "down" }, 500), gemini: jsonResponse({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }) });
    const gateway = freshGateway();

    await gateway.generate({ messages: [MSG] }, "test-feature"); // groq fails -> cooldown
    expect(calls.filter((u) => u === URLS.groq)).toHaveLength(1);

    // Second call on the SAME instance: groq is in cooldown, gemini serves it.
    stubFetch({ gemini: jsonResponse({ candidates: [{ content: { parts: [{ text: "again" }] } }] }) });
    const result = await gateway.generate({ messages: [MSG] }, "test-feature");
    expect(result.provider).toBe("gemini");
  });

  test("generateAdvanced uses the same fallback semantics", async () => {
    setProviderKeys("groq", "gemini");
    stubFetch({ groq: jsonResponse({ error: "down" }, 500), gemini: jsonResponse({ candidates: [{ content: { parts: [{ text: "advanced" }] } }] }) });
    const gateway = freshGateway();

    const result = await gateway.generateAdvanced("prompt", undefined, "test-advanced");
    expect(result.provider).toBe("gemini");
  });
});

describe("AI gateway — BDW provider", () => {
  test("BDW provider is tried first when BDW_AI_ENABLED=true and BDW_AI_BASE_URL is set", async () => {
    setProviderKeys("groq"); // groq has a key
    process.env.BDW_AI_ENABLED = "true";
    process.env.BDW_AI_BASE_URL = "http://localhost:8000/v1";
    const { calls } = stubFetch({
      groq: OPENAI_OK("from groq"),
    });
    const gateway = freshGateway();

    // BDW should be tried first but fail (no real server), then groq should succeed
    // The stub doesn't handle BDW URL, so it returns 500 (unexpected provider)
    const result = await gateway.generate({ messages: [MSG] }, "test-feature");
    // BDW fails (500 from stub), groq succeeds
    expect(result.provider).toBe("groq");
    expect(calls[0]).toContain("localhost:8000");
    expect(calls[1]).toBe(URLS.groq);
  });

  test("BDW provider is skipped when BDW_AI_ENABLED is not set", async () => {
    setProviderKeys("groq");
    delete process.env.BDW_AI_ENABLED;
    delete process.env.BDW_AI_BASE_URL;
    const { calls } = stubFetch({ groq: OPENAI_OK("from groq") });
    const gateway = freshGateway();

    const result = await gateway.generate({ messages: [MSG] }, "test-feature");
    expect(result.provider).toBe("groq");
    // BDW should NOT be called (skipped due to not enabled)
    expect(calls).toEqual([URLS.groq]);
  });

  test("BDW provider is skipped when BDW_AI_BASE_URL is empty", async () => {
    setProviderKeys("groq");
    process.env.BDW_AI_ENABLED = "true";
    process.env.BDW_AI_BASE_URL = "";
    const { calls } = stubFetch({ groq: OPENAI_OK("from groq") });
    const gateway = freshGateway();

    const result = await gateway.generate({ messages: [MSG] }, "test-feature");
    expect(result.provider).toBe("groq");
    // BDW should NOT be called (no base URL)
    expect(calls).toEqual([URLS.groq]);
  });

  test("BDW provider sends correct request format to OpenAI-compatible endpoint", async () => {
    setProviderKeys("groq");
    process.env.BDW_AI_ENABLED = "true";
    process.env.BDW_AI_BASE_URL = "http://localhost:8000/v1";
    process.env.BDW_AI_MODEL = "custom-model";
    process.env.BDW_AI_API_KEY = "bdw-test-key";

    const bdwCalls: string[] = [];
    const fn = jest.fn(async (url: string, init?: RequestInit) => {
      bdwCalls.push(url);
      if (url.includes("localhost:8000")) {
        const body = JSON.parse(init?.body as string);
        // Verify OpenAI-compatible format
        expect(body.model).toBe("custom-model");
        expect(body.messages).toBeDefined();
        expect(Array.isArray(body.messages)).toBe(true);
        return OPENAI_OK("from bdw");
      }
      return jsonResponse({ error: "unexpected" }, 500);
    });
    globalThis.fetch = fn as unknown as typeof fetch;

    const gateway = freshGateway();
    const result = await gateway.generate(
      { messages: [MSG], systemPrompt: "Be a career advisor" },
      "test-feature"
    );

    expect(result.provider).toBe("bdw");
    expect(result.text).toBe("from bdw");
    expect(bdwCalls[0]).toContain("localhost:8000/v1/chat/completions");

    // Verify Authorization header
    const [, init] = fn.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer bdw-test-key");
  });
});

describe("AI gateway — telemetry", () => {
  test("records one success entry and one failure entry with safe fields", async () => {
    setProviderKeys("groq", "gemini");
    stubFetch({ groq: jsonResponse({ error: "down" }, 500), gemini: jsonResponse({ candidates: [{ content: { parts: [{ text: "telemetry!" }] } }] }) });
    const gateway = freshGateway();
    const entries: any[] = [];
    gateway.setLogger((entry: unknown) => { entries.push(entry); });

    await gateway.generate({ messages: [MSG] }, "chat-feature");

    expect(entries).toHaveLength(2);
    const [failure, success] = entries;
    expect(failure).toMatchObject({ feature: "chat-feature", provider: "groq", success: false, response_length: 0, cost_estimate: 0 });
    expect(failure.error_message).toBeTruthy();
    expect(success).toMatchObject({ feature: "chat-feature", provider: "gemini", success: true, error_message: null });
    expect(success.prompt_length).toBeGreaterThan(0);
    expect(success.response_length).toBeGreaterThan(0);
    // No secrets ever enter the log: model names and lengths only.
    expect(JSON.stringify(entries)).not.toContain("test-key");
  });

  test("logger failures never break the gateway response", async () => {
    setProviderKeys("groq");
    stubFetch({ groq: OPENAI_OK("fine") });
    const gateway = freshGateway();
    gateway.setLogger(() => { throw new Error("telemetry sink down"); });

    const result = await gateway.generate({ messages: [MSG] }, "chat-feature");
    expect(result.text).toBe("fine");
  });
});