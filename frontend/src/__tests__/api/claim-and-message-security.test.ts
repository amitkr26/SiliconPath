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
let mockIsAdmin = false;

jest.mock("@/lib/employer-auth", () => ({
  getAuthenticatedEmployerUser: jest.fn(async () => mockCurrentUser),
  requireEmployerRole: jest.fn(async () => mockCurrentUser),
  isUserAdmin: jest.fn((user: any) => mockIsAdmin || user?.app_metadata?.role === "admin" || user?.role === "admin"),
  isUserEmployer: jest.fn(async (user: any) => true),
}));

jest.mock("@/lib/admin-auth", () => ({
  verifyAdmin: jest.fn(async () => mockIsAdmin),
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

const mockFrom = jest.fn();
jest.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (...args: any[]) => mockFrom(...args),
  },
  isAdminConfigured: true,
}));

import { NextRequest } from "next/server";
import { POST as postMessage } from "@/app/api/messages/route";
import { PATCH as patchClaim } from "@/app/api/employer/claim/route";

describe("Message Participant Security & Company Claim Verification Lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = null;
    mockIsAdmin = false;
  });

  describe("Messages Participant Gate", () => {
    it("rejects unauthorized message injection when user is not a participant (returns 403)", async () => {
      mockCurrentUser = { id: "attacker-user-id" };

      // Mock conversation lookup returning participants user-b and user-c
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { participant_a: "user-b", participant_b: "user-c" },
          error: null,
        }),
      });

      const req = new NextRequest("http://localhost:3000/api/messages", {
        method: "POST",
        body: JSON.stringify({
          conversationId: "conv-bc",
          content: "Injected message from unauthorized user",
        }),
      });

      const res = await postMessage(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/Not a participant/i);
    });

    it("allows message when user is a valid conversation participant (returns 201)", async () => {
      mockCurrentUser = { id: "user-b" };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "msg-123", body: "Hello", sender_id: "user-b" },
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "conversations") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { participant_a: "user-b", participant_b: "user-c" },
              error: null,
            }),
            update: mockUpdate,
          };
        }
        if (table === "messages") {
          return {
            insert: mockInsert,
          };
        }
        if (table === "user_profiles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { display_name: "User B" },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const req = new NextRequest("http://localhost:3000/api/messages", {
        method: "POST",
        body: JSON.stringify({
          conversationId: "conv-bc",
          content: "Legitimate message from participant",
        }),
      });

      const res = await postMessage(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.message).toBeDefined();
    });
  });

  describe("Company Claim Lifecycle Gate", () => {
    it("rejects claim review from non-admin user (returns 403)", async () => {
      mockCurrentUser = { id: "regular-employer-id", role: "employer" };
      mockIsAdmin = false;

      const req = new NextRequest("http://localhost:3000/api/employer/claim", {
        method: "PATCH",
        body: JSON.stringify({
          claimId: "claim-123",
          status: "approved",
        }),
      });

      const res = await patchClaim(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/Admin access required/i);
    });

    it("admin approval updates company_claims and writes ownership into company_pages (returns 200)", async () => {
      mockCurrentUser = { id: "admin-user-id", role: "admin", app_metadata: { role: "admin" } };
      mockIsAdmin = true;

      const mockClaimUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: "claim-123",
                organization_id: "org-456",
                claimed_by: "employer-789",
                status: "approved",
                organization: {
                  id: "org-456",
                  name: "Acme Corp",
                  slug: "acme-corp",
                  website: "https://acme.example.com",
                },
              },
              error: null,
            }),
          }),
        }),
      });

      const mockCompanyUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockNotificationsInsert = jest.fn().mockResolvedValue({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === "company_claims") {
          return { update: mockClaimUpdate };
        }
        if (table === "company_pages") {
          return { upsert: mockCompanyUpsert };
        }
        if (table === "notifications") {
          return { insert: mockNotificationsInsert };
        }
        return {};
      });

      const req = new NextRequest("http://localhost:3000/api/employer/claim", {
        method: "PATCH",
        body: JSON.stringify({
          claimId: "claim-123",
          status: "approved",
        }),
      });

      const res = await patchClaim(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.claim.status).toBe("approved");

      // Verify company_pages was updated with ownership
      expect(mockCompanyUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: "org-456",
          claimed_by: "employer-789",
          is_verified: true,
        }),
        { onConflict: "organization_id" }
      );
    });
  });
});
