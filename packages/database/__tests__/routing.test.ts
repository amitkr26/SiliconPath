import {
  getClientForPurpose,
  createDatabaseClients,
  resetClients,
  checkAllDatabases,
  DbPurpose,
} from "../src/client";

describe("getClientForPurpose", () => {
  beforeEach(() => {
    resetClients();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://db1.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "db1-key";
    process.env.SUPABASE_2_URL = "https://db2.supabase.co";
    process.env.SUPABASE_2_SERVICE_ROLE_KEY = "db2-key";
    process.env.NEON_1_DATABASE_URL = "postgres://user:pass@ep-analytics.us-east-2.aws.neon.tech/neondb";
    process.env.NEON_2_DATABASE_URL = "postgres://user:pass@ep-background.us-east-2.aws.neon.tech/neondb";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_2_URL;
    delete process.env.SUPABASE_2_SERVICE_ROLE_KEY;
    delete process.env.NEON_1_DATABASE_URL;
    delete process.env.NEON_2_DATABASE_URL;
    resetClients();
  });

  it("routes 'opportunities' to DB1 (supabase)", () => {
    const result = getClientForPurpose("opportunities");
    expect(result.type).toBe("supabase");
    expect(result.client).not.toBeNull();
  });

  it("routes 'news' to DB1 (supabase)", () => {
    const result = getClientForPurpose("news");
    expect(result.type).toBe("supabase");
    expect(result.client).not.toBeNull();
  });

  it("routes 'social' to DB1 (supabase) — per spec critical clarification", () => {
    const result = getClientForPurpose("social");
    expect(result.type).toBe("supabase");
    expect(result.client).not.toBeNull();
  });

  it("routes 'analytics' to Neon1", () => {
    const result = getClientForPurpose("analytics");
    expect(result.type).toBe("neon");
    expect(result.client).not.toBeNull();
  });

  it("routes 'cache' to Neon2", () => {
    const result = getClientForPurpose("cache");
    expect(result.type).toBe("neon");
    expect(result.client).not.toBeNull();
  });

  it("returns null client when env vars are missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    resetClients();
    const result = getClientForPurpose("opportunities");
    expect(result.client).toBeNull();
  });
});

describe("createDatabaseClients", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://db1.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "db1-key";
    process.env.SUPABASE_2_URL = "https://db2.supabase.co";
    process.env.SUPABASE_2_SERVICE_ROLE_KEY = "db2-key";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_2_URL;
    delete process.env.SUPABASE_2_SERVICE_ROLE_KEY;
  });

  it("creates Supabase clients when env vars are set", () => {
    const clients = createDatabaseClients();
    expect(clients.db1).not.toBeNull();
    expect(clients.db2).not.toBeNull();
  });

  it("returns null for unconfigured databases", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const clients = createDatabaseClients();
    expect(clients.db1).toBeNull();
  });
});

describe("checkAllDatabases", () => {
  it("returns not_configured for databases without env vars", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_2_URL;
    delete process.env.SUPABASE_2_SERVICE_ROLE_KEY;
    delete process.env.NEON_1_DATABASE_URL;
    delete process.env.NEON_2_DATABASE_URL;
    resetClients();
    const results = await checkAllDatabases();
    expect(results.supabase_primary).toBe("not_configured");
    expect(results.supabase_secondary).toBe("not_configured");
    expect(results.neon_primary).toBe("not_configured");
    expect(results.neon_secondary).toBe("not_configured");
  });
});
