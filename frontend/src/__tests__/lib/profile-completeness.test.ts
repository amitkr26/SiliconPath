import { calculateProfileCompleteness } from "@/lib/profile-completeness";

describe("calculateProfileCompleteness", () => {
  it("returns 0% for completely empty profile and empty relations", () => {
    const res = calculateProfileCompleteness({
      profile: null,
      experiences: [],
      educations: [],
      projects: [],
    });
    expect(res.score).toBe(0);
    expect(res.percentage).toBe(0);
    expect(res.missingItems.length).toBeGreaterThan(0);
  });

  it("calculates correct score with identity, avatar, and bio", () => {
    const res = calculateProfileCompleteness({
      profile: {
        display_name: "Ajeet Kumar",
        username: "ajeet",
        avatar_url: "https://example.com/avatar.jpg",
        bio: "Senior VLSI Engineer",
      },
      experiences: [],
      educations: [],
      projects: [],
    });
    // Identity (15) + Avatar (10) + Bio (10) = 35
    expect(res.score).toBe(35);
    expect(res.percentage).toBe(35);
    expect(res.breakdown.identity).toBe(true);
    expect(res.breakdown.avatar).toBe(true);
    expect(res.breakdown.bio).toBe(true);
    expect(res.breakdown.experience).toBe(false);
  });

  it("calculates 100% for full candidate profile with all sub-resources", () => {
    const res = calculateProfileCompleteness({
      profile: {
        display_name: "Amit Semiconductor Lead",
        username: "amit_semi",
        avatar_url: "https://example.com/photo.png",
        bio: "Specializing in UVM, RTL, ASIC design",
        location: "Bengaluru, India",
        skills: ["SystemVerilog", "UVM", "Verilog"],
        is_open_to_work: true,
        open_to_work_types: ["Full-time"],
      },
      experiences: [
        {
          id: "exp-1",
          candidate_id: "u1",
          company_name: "Synopsys",
          role_title: "Senior Verification Engineer",
          employment_type: "Full-time",
          location: "Bengaluru",
          start_date: "2022-01-01",
          end_date: null,
          is_current: true,
          description: "Led verification",
          skills_used: ["UVM"],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      educations: [
        {
          id: "edu-1",
          candidate_id: "u1",
          institution: "IIT Bombay",
          degree: "M.Tech",
          field_of_study: "VLSI Design",
          start_year: 2020,
          end_year: 2022,
          grade: "9.5",
          description: "Thesis on RISC-V",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      projects: [
        {
          id: "proj-1",
          candidate_id: "u1",
          title: "RISC-V Core",
          description: "Out of order RV64GC core",
          technologies: ["SystemVerilog", "UVM"],
          project_url: null,
          github_url: "https://github.com/test/core",
          start_date: null,
          end_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    });
    expect(res.score).toBe(100);
    expect(res.percentage).toBe(100);
    expect(res.missingItems.length).toBe(0);
  });
});
