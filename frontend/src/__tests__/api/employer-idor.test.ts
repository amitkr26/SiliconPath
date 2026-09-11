/**
 * @jest-environment node
 */

jest.mock('next/server', () => {
  class MockNextRequest {
    url: string;
    method: string;
    headers: { get: (name: string) => string | null };
    private _body: any;
    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method || 'GET';
      const headerMap: Record<string, string> = {};
      if (init?.headers) {
        for (const [k, v] of Object.entries(init.headers)) {
          headerMap[k.toLowerCase()] = String(v ?? '');
        }
      }
      this.headers = { get: (name: string) => headerMap[name.toLowerCase()] ?? null };
      this._body = init?.body ? JSON.parse(init.body) : null;
    }
    async json() { return this._body; }
  }
  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: any, init?: any) => {
        const status = init?.status || 200;
        return { status, json: async () => body };
      },
    },
  };
});

let mockCurrentUser: any = null;
jest.mock("@/lib/employer-auth", () => ({
  getAuthenticatedEmployerUser: jest.fn(async () => mockCurrentUser),
  requireEmployerRole: jest.fn(async () => mockCurrentUser),
  isUserAdmin: jest.fn((user: any) => user?.app_metadata?.role === "admin" || user?.role === "admin"),
  isUserEmployer: jest.fn(async (user: any) => user?.user_metadata?.role === "employer" || user?.app_metadata?.role === "employer" || user?.role === "employer" || user?.id?.startsWith("employer")),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: jest.fn(async () => ({ data: { user: mockCurrentUser }, error: null })),
    },
  })),
}));

jest.mock("@/lib/supabase", () => ({
  isAdminConfigured: true,
}));
jest.mock("@/lib/supabase-admin", () => {
  const mockFrom = jest.fn();
  return {
    supabaseAdmin: {
      from: mockFrom,
    },
    isAdminConfigured: true,
  };
});

import { NextRequest } from "next/server";
import { PATCH as patchJob, DELETE as deleteJob } from "@/app/api/employer/jobs/route";
import { PATCH as patchApplicant } from "@/app/api/employer/applicants/route";
import { PATCH as patchApplication } from "@/app/api/applications/route";
import { PATCH as patchCompany } from "@/app/api/employer/company/route";

const { supabaseAdmin } = require("@/lib/supabase-admin");

describe("Employer & Candidate IDOR Prevention Gates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("1. Employer A cannot PATCH Employer B's job (returns 403)", async () => {
    mockCurrentUser = { id: "employer-a-id", user_metadata: { role: "employer" } };

    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: "opp-b-id", created_by: "employer-b-id" },
        error: null,
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/employer/jobs", {
      method: "PATCH",
      body: JSON.stringify({ id: "opp-b-id", title: "Hacked Title" }),
    });

    const res = await patchJob(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/Forbidden: You do not own this opportunity/i);
  });

  it("2. Employer A cannot DELETE Employer B's job (returns 403)", async () => {
    mockCurrentUser = { id: "employer-a-id", user_metadata: { role: "employer" } };

    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: "opp-b-id", created_by: "employer-b-id" },
        error: null,
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/employer/jobs?id=opp-b-id", {
      method: "DELETE",
    });

    const res = await deleteJob(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/Forbidden: You do not own this opportunity/i);
  });

  it("3. Employer A cannot PATCH applicant on Employer B's opportunity (returns 403)", async () => {
    mockCurrentUser = { id: "employer-a-id", user_metadata: { role: "employer" } };

    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: "app-id",
          opportunity_id: "opp-b-id",
          opportunity: { id: "opp-b-id", created_by: "employer-b-id" },
        },
        error: null,
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/employer/applicants", {
      method: "PATCH",
      body: JSON.stringify({ id: "app-id", status: "rejected", notes: "Malicious rejection" }),
    });

    const res = await patchApplicant(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/Forbidden: You do not own the opportunity for this application/i);
  });

  it("4. Candidate cannot self-approve application status to 'accepted' (returns 403)", async () => {
    mockCurrentUser = { id: "candidate-id", user_metadata: { role: "seeker" } };

    const req = new NextRequest("http://localhost:3000/api/applications", {
      method: "PATCH",
      body: JSON.stringify({ id: "app-id", status: "accepted" }),
    });

    const res = await patchApplication(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/Application status changes are restricted to employers/i);
  });

  it("5. Candidate CAN withdraw application via DELETE (returns 200)", async () => {
    mockCurrentUser = { id: "candidate-id", user_metadata: { role: "seeker" } };

    supabaseAdmin.from.mockReturnValue({
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: jest.fn((cb) => Promise.resolve(cb({ error: null }))),
    });

    const { DELETE: deleteApplication } = await import("@/app/api/applications/route");
    const req = new NextRequest("http://localhost:3000/api/applications?id=app-id", {
      method: "DELETE",
    });

    const res = await deleteApplication(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("6. Employer A cannot hijack company page claimed by Employer B (returns 403)", async () => {
    mockCurrentUser = { id: "employer-a-id", user_metadata: { role: "employer" } };

    supabaseAdmin.from.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        return {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "organizations") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: "org-b-id", created_by: "employer-b-id" },
            error: null,
          }),
        };
      }
      if (table === "company_pages") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: "page-b-id", claimed_by: "employer-b-id" },
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const req = new NextRequest("http://localhost:3000/api/employer/company", {
      method: "PATCH",
      body: JSON.stringify({ name: "Employer B Corp", website: "https://hacked.com" }),
    });

    const res = await patchCompany(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/Forbidden: This organization is already claimed/i);
  });

  it("7. Employer A CAN edit their own job (returns 200)", async () => {
    mockCurrentUser = { id: "employer-a-id", user_metadata: { role: "employer" } };

    supabaseAdmin.from.mockImplementation((table: string) => {
      if (table === "opportunities") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: "opp-a-id", created_by: "employer-a-id" },
            error: null,
          }),
          update: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: "opp-a-id", title: "Legitimate Update", created_by: "employer-a-id" },
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const req = new NextRequest("http://localhost:3000/api/employer/jobs", {
      method: "PATCH",
      body: JSON.stringify({ id: "opp-a-id", title: "Legitimate Update" }),
    });

    const res = await patchJob(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("8. Employer A CAN update applicant on their own opportunity (returns 200)", async () => {
    mockCurrentUser = { id: "employer-a-id", user_metadata: { role: "employer" } };

    supabaseAdmin.from.mockImplementation((table: string) => {
      if (table === "applications") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: "app-id",
              opportunity_id: "opp-a-id",
              opportunity: { id: "opp-a-id", created_by: "employer-a-id" },
            },
            error: null,
          }),
          update: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: "app-id", status: "shortlisted" },
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const req = new NextRequest("http://localhost:3000/api/employer/applicants", {
      method: "PATCH",
      body: JSON.stringify({ id: "app-id", status: "shortlisted" }),
    });

    const res = await patchApplicant(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
