/**
 * @jest-environment node
 */
import { verifyAdmin, verifyCron } from "@/lib/admin-auth";
import { POST as authPost } from "@/app/api/admin/auth/route";
import { createHmac } from "crypto";

describe("Admin Authentication & Session Verification", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ADMIN_USERNAME: "testadmin",
      ADMIN_PASSWORD: "SuperSecretPassword123!",
      ADMIN_HMAC_SECRET: "HmacSecretKeyXYZ789",
      CRON_SECRET: "CronSecretKey456",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("1. POST /api/admin/auth succeeds with valid credentials and issues HMAC token", async () => {
    const req = new Request("http://localhost:3000/api/admin/auth", {
      method: "POST",
      body: JSON.stringify({
        username: "testadmin",
        password: "SuperSecretPassword123!",
      }),
    });

    const res = await authPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.authenticated).toBe(true);
    expect(data.token).toBeDefined();

    // Verify token can authenticate via verifyAdmin
    const mockReq = {
      headers: new Headers({
        authorization: `Bearer ${data.token}`,
      }),
    } as any;
    expect(await verifyAdmin(mockReq)).toBe(true);
  });

  it("2. POST /api/admin/auth rejects invalid password with 401", async () => {
    const req = new Request("http://localhost:3000/api/admin/auth", {
      method: "POST",
      body: JSON.stringify({
        username: "testadmin",
        password: "WrongPassword999",
      }),
    });

    const res = await authPost(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.authenticated).toBe(false);
  });

  it("3. POST /api/admin/auth rejects invalid username with 401", async () => {
    const req = new Request("http://localhost:3000/api/admin/auth", {
      method: "POST",
      body: JSON.stringify({
        username: "hacker",
        password: "SuperSecretPassword123!",
      }),
    });

    const res = await authPost(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.authenticated).toBe(false);
  });

  it("4. verifyAdmin rejects requests with missing credentials", async () => {
    const mockReq = {
      headers: new Headers(),
    } as any;
    expect(await verifyAdmin(mockReq)).toBe(false);
  });

  it("5. verifyAdmin accepts valid x-admin-password header", async () => {
    const mockReq = {
      headers: new Headers({
        "x-admin-password": "SuperSecretPassword123!",
      }),
    } as any;
    expect(await verifyAdmin(mockReq)).toBe(true);
  });

  it("6. verifyAdmin rejects incorrect x-admin-password header", async () => {
    const mockReq = {
      headers: new Headers({
        "x-admin-password": "IncorrectPassword!",
      }),
    } as any;
    expect(await verifyAdmin(mockReq)).toBe(false);
  });

  it("7. verifyAdmin accepts direct ADMIN_PASSWORD Bearer token", async () => {
    const mockReq = {
      headers: new Headers({
        authorization: "Bearer SuperSecretPassword123!",
      }),
    } as any;
    expect(await verifyAdmin(mockReq)).toBe(true);
  });

  it("8. verifyAdmin rejects tampered HMAC signature", async () => {
    const sessionId = "fake-session-id";
    const expiry = Date.now() + 100000;
    const fakeSig = "deadbeef1234567890abcdefdeadbeef";
    const tamperedToken = `${sessionId}.${expiry}.${fakeSig}`;

    const mockReq = {
      headers: new Headers({
        authorization: `Bearer ${tamperedToken}`,
      }),
    } as any;
    expect(await verifyAdmin(mockReq)).toBe(false);
  });

  it("9. verifyAdmin rejects expired HMAC token", async () => {
    const sessionId = "expired-session-id";
    const expiredTime = Date.now() - 5000; // 5 seconds in past
    const sig = createHmac("sha256", process.env.ADMIN_HMAC_SECRET!)
      .update(`${sessionId}.${expiredTime}`)
      .digest("hex");
    const expiredToken = `${sessionId}.${expiredTime}.${sig}`;

    const mockReq = {
      headers: new Headers({
        authorization: `Bearer ${expiredToken}`,
      }),
    } as any;
    expect(await verifyAdmin(mockReq)).toBe(false);
  });

  it("10. verifyCron accepts valid CRON_SECRET and rejects invalid secret", () => {
    const validReq = {
      headers: new Headers({
        authorization: "Bearer CronSecretKey456",
      }),
    } as any;
    expect(verifyCron(validReq)).toBe(true);

    const invalidReq = {
      headers: new Headers({
        authorization: "Bearer MaliciousCronSecret",
      }),
    } as any;
    expect(verifyCron(invalidReq)).toBe(false);
  });
});
