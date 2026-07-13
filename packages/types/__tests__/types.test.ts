import {
  Opportunity,
  User,
  Application,
  Notification,
  AIInteraction,
  Announcement,
  BookmarkedOpportunity,
  Category,
} from "../src/index";

describe("Type exports", () => {
  it("exports Opportunity type", () => {
    const opp: Opportunity = {
      id: "1",
      title: "Test",
      url: "https://example.com",
      category: "JRF",
      company: "Test Corp",
      deadline: "2025-12-31",
      verification_status: "pending",
    };
    expect(opp.title).toBe("Test");
  });

  it("exports User type", () => {
    const user: User = {
      id: "u1",
      email: "test@example.com",
      created_at: "2025-01-01",
    };
    expect(user.email).toBe("test@example.com");
  });

  it("exports Application type", () => {
    const app: Application = {
      id: "a1",
      user_id: "u1",
      full_name: "Test User",
      category: "JRF",
      status: "pending",
      created_at: "2025-01-01",
    };
    expect(app.status).toBe("pending");
  });

  it("exports Notification type", () => {
    const notif: Notification = {
      id: "n1",
      user_id: "u1",
      type: "new_opportunity",
      title: "New JRF",
      body: "A new JRF opportunity is available",
      read: false,
      created_at: "2025-01-01",
    };
    expect(notif.read).toBe(false);
  });

  it("exports AIInteraction type", () => {
    const ai: AIInteraction = {
      id: "ai1",
      user_id: "u1",
      provider: "groq",
      model: "mixtral-8x7b-32768",
      prompt_tokens: 100,
      completion_tokens: 50,
      created_at: "2025-01-01",
    };
    expect(ai.provider).toBe("groq");
  });

  it("exports Announcement type", () => {
    const ann: Announcement = {
      id: "ann1",
      title: "System Update",
      body: "System will be down for maintenance",
      active: true,
      created_at: "2025-01-01",
    };
    expect(ann.active).toBe(true);
  });

  it("exports BookmarkedOpportunity type", () => {
    const bm: BookmarkedOpportunity = {
      id: "bm1",
      user_id: "u1",
      opportunity_id: "opp1",
      created_at: "2025-01-01",
    };
    expect(bm.opportunity_id).toBe("opp1");
  });

  it("exports Category type", () => {
    const cat: Category = "JRF";
    expect(cat).toBe("JRF");
  });
});
