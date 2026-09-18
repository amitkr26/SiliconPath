/**
 * BDW AI Tool Execution — Server-Only Module
 *
 * This module contains the actual tool execution logic extracted from the
 * /api/ai/bdw-tools route. It is imported DIRECTLY by /api/ai/chat/route.ts,
 * eliminating the need for a self-referential HTTP fetch.
 *
 * SECURITY: This file is server-only. It must never be imported by client
 * components. All database access uses the service-role client (supabaseAdmin)
 * for consistency with the chat route's RAG queries.
 */

import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limiter";
import { escapeILIKE } from "@/lib/ai/bdw-rag";
import type {
  BDWToolName,
  ToolResult,
  SearchOpportunitiesResult,
  SearchOrganizationsResult,
  CheckEligibilityResult,
  GetRequiredSkillsResult,
  FindRelatedResult,
  GetCareerRoadmapResult,
  SearchNewsResult,
} from "@/lib/ai/bdw-tools";

// ─── Rate Limiting ────────────────────────────────────────────────────────

const TOOL_RATE_LIMIT = 10;
const TOOL_RATE_WINDOW_SECONDS = 60;

async function checkToolRateLimit(tool: string, identifier: string): Promise<boolean> {
  const key = `bdw-tool:${identifier}:${tool}`;
  const { success } = await rateLimit(key, TOOL_RATE_LIMIT, TOOL_RATE_WINDOW_SECONDS);
  return success;
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Execute a BDW tool. Called directly from the chat route — no HTTP involved.
 *
 * @param tool     Tool name
 * @param args     Tool arguments (from AI model output)
 * @param userId   Authenticated user ID or "anonymous" for guests
 */
export async function executeBDWTool(
  tool: BDWToolName,
  args: Record<string, unknown>,
  userId: string = "anonymous"
): Promise<ToolResult> {
  if (!isAdminConfigured || !supabaseAdmin) {
    return { tool, success: false, data: null, error: "Database not configured" };
  }

  if (!(await checkToolRateLimit(tool, userId))) {
    return {
      tool,
      success: false,
      data: null,
      error: "Rate limit exceeded for this tool. Please try again in a minute.",
    };
  }

  try {
    switch (tool) {
      case "search_opportunities":
        return { tool, success: true, data: await searchOpportunities(supabaseAdmin, args) };
      case "search_organizations":
        return { tool, success: true, data: await searchOrganizations(supabaseAdmin, args) };
      case "check_eligibility":
        return { tool, success: true, data: await checkEligibility(supabaseAdmin, args) };
      case "get_required_skills":
        return { tool, success: true, data: await getRequiredSkills(supabaseAdmin, args) };
      case "find_related_opportunities":
        return { tool, success: true, data: await findRelatedOpportunities(supabaseAdmin, args) };
      case "get_career_roadmap":
        return { tool, success: true, data: await getCareerRoadmap(args) };
      case "search_news":
        return { tool, success: true, data: await searchNews(supabaseAdmin, args) };
      default:
        return { tool, success: false, data: null, error: `Unknown tool: ${tool}` };
    }
  } catch (error) {
    return {
      tool,
      success: false,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Valid tool names — exported for validation.
 */
export const VALID_BDW_TOOLS: string[] = [
  "search_opportunities", "search_organizations", "check_eligibility",
  "get_required_skills", "find_related_opportunities", "get_career_roadmap",
  "search_news",
];

// ─── Tool Implementations ─────────────────────────────────────────────────

async function searchOpportunities(
  db: any,
  args: Record<string, unknown>
): Promise<SearchOpportunitiesResult> {
  const {
    query = "",
    category,
    field,
    location,
    eligibility,
    limit = 5,
  } = args as {
    query?: string;
    category?: string;
    field?: string;
    location?: string;
    eligibility?: string;
    limit?: number;
  };

  const maxLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);
  let qb = db
    .from("opportunities")
    .select("id, title, organization, category, location, deadline, salary_range, eligibility, description, apply_url, slug, verification_status")
    .eq("is_active", true)
    .neq("verification_status", "rejected");

  if (query) {
    const terms = query.toLowerCase().split(/\s+/).filter((t: string) => t.length >= 2);
    if (terms.length > 0) {
      const clauses = terms.map((t: string) =>
        `title.ilike.%${escapeILIKE(t)}%,description.ilike.%${escapeILIKE(t)}%,organization.ilike.%${escapeILIKE(t)}%`
      );
      qb = qb.or(clauses.join(","));
    }
  }

  if (category && category !== "any") {
    qb = qb.ilike("category", `%${escapeILIKE(category)}%`);
  }
  if (field && field !== "any") {
    qb = qb.or(`description.ilike.%${escapeILIKE(field)}%,category.ilike.%${escapeILIKE(field)}%`);
  }
  if (location) {
    qb = qb.ilike("location", `%${escapeILIKE(location)}%`);
  }
  if (eligibility && eligibility !== "any") {
    qb = qb.ilike("eligibility", `%${escapeILIKE(eligibility)}%`);
  }

  qb = qb.order("created_at", { ascending: false }).limit(maxLimit);

  const { data, error } = await qb;
  if (error) throw error;

  const opportunities = (data || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    organization: r.organization,
    category: r.category,
    location: r.location,
    deadline: r.deadline,
    stipend: r.salary_range || null,
    eligibility: r.eligibility,
    apply_url: r.apply_url,
    slug: r.slug,
    verification_status: r.verification_status,
  }));

  return { opportunities, total: opportunities.length };
}

async function searchOrganizations(
  db: any,
  args: Record<string, unknown>
): Promise<SearchOrganizationsResult> {
  const { query = "", type, limit = 5 } = args as {
    query?: string;
    type?: string;
    limit?: number;
  };

  const maxLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);
  let qb = db
    .from("organizations")
    .select("id, name, slug, type, location, website, logo_url, description");

  if (query) {
    const terms = query.toLowerCase().split(/\s+/).filter((t: string) => t.length >= 2);
    if (terms.length > 0) {
      const clauses = terms.map((t: string) =>
        `name.ilike.%${escapeILIKE(t)}%,type.ilike.%${escapeILIKE(t)}%,description.ilike.%${escapeILIKE(t)}%`
      );
      qb = qb.or(clauses.join(","));
    }
  }

  if (type && type !== "any") {
    qb = qb.eq("type", type);
  }

  qb = qb.limit(maxLimit);

  const { data, error } = await qb;
  if (error) throw error;

  const organizations: SearchOrganizationsResult["organizations"] = [];
  for (const org of data || []) {
    const { count } = await db
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .eq("is_active", true);

    organizations.push({
      id: org.id,
      name: org.name,
      type: org.type,
      location: org.location,
      website: org.website,
      opportunity_count: count || 0,
    });
  }

  return { organizations, total: organizations.length };
}

async function checkEligibility(
  db: any,
  args: Record<string, unknown>
): Promise<CheckEligibilityResult> {
  const { opportunity_id, user_degree, user_branch, user_skills } = args as {
    opportunity_id: string;
    user_degree?: string;
    user_branch?: string;
    user_skills?: string[];
  };

  const { data: opp, error } = await db
    .from("opportunities")
    .select("id, title, eligibility, category, deadline, description")
    .eq("id", opportunity_id)
    .single();

  if (error || !opp) {
    throw new Error(`Opportunity not found: ${opportunity_id}`);
  }

  const eligibilityText = (opp.eligibility || "").toLowerCase();
  const descriptionText = (opp.description || "").toLowerCase();
  const fullText = `${eligibilityText} ${descriptionText}`;

  const matched: string[] = [];
  const missing: string[] = [];
  const recommendations: string[] = [];

  if (user_degree) {
    const degree = user_degree.toLowerCase();
    const degreePatterns: Record<string, string[]> = {
      "b.tech": ["b.tech", "bachelor", "undergraduate", "b.e.", "bachelor of engineering"],
      "m.tech": ["m.tech", "master", "postgraduate", "m.e.", "master of engineering"],
      "phd": ["phd", "doctoral", "doctorate", "ph.d"],
      "b.sc": ["b.sc", "bachelor of science"],
      "m.sc": ["m.sc", "master of science"],
      "diploma": ["diploma", "polytechnic"],
    };

    const patterns = degreePatterns[degree] || [degree];
    const hasMatch = patterns.some((p) => fullText.includes(p));

    if (hasMatch) {
      matched.push(`Degree: ${user_degree}`);
    } else if (fullText.includes("b.tech") || fullText.includes("m.tech") || fullText.includes("phd")) {
      missing.push(`Required: specific degree level (found: ${user_degree})`);
      recommendations.push("Check the opportunity's eligibility criteria for exact degree requirements");
    }
  }

  if (user_branch) {
    const branch = user_branch.toLowerCase();
    const branchKeywords = ["electronics", "computer", "electrical", "mechanical", "cs", "ec", "ee", "it"];
    if (branchKeywords.some((k) => fullText.includes(k))) {
      if (fullText.includes(branch) || fullText.includes(user_branch.toLowerCase())) {
        matched.push(`Branch: ${user_branch}`);
      } else {
        missing.push(`Branch match uncertain (your: ${user_branch})`);
        recommendations.push("Review the opportunity description for branch-specific requirements");
      }
    }
  }

  if (user_skills && user_skills.length > 0) {
    const descLower = descriptionText;
    for (const skill of user_skills) {
      if (descLower.includes(skill.toLowerCase())) {
        matched.push(`Skill: ${skill}`);
      }
    }
    if (matched.length === 0) {
      recommendations.push("Consider developing skills mentioned in the opportunity description");
    }
  }

  if (opp.deadline) {
    const deadlineDate = new Date(opp.deadline);
    const now = new Date();
    if (deadlineDate < now) {
      missing.push(`Deadline passed: ${opp.deadline}`);
    } else {
      matched.push(`Deadline: ${opp.deadline}`);
    }
  }

  return {
    opportunity: {
      id: opp.id,
      title: opp.title,
      eligibility: opp.eligibility,
      category: opp.category,
      deadline: opp.deadline,
    },
    eligible: missing.length === 0,
    matched,
    missing,
    recommendations,
  };
}

async function getRequiredSkills(
  db: any,
  args: Record<string, unknown>
): Promise<GetRequiredSkillsResult> {
  const { role, opportunity_id } = args as {
    role: string;
    opportunity_id?: string;
  };

  if (opportunity_id) {
    const { data: opp } = await db
      .from("opportunities")
      .select("title, description, eligibility, organization")
      .eq("id", opportunity_id)
      .single();

    if (opp) {
      const text = `${opp.title} ${opp.description || ""} ${opp.eligibility || ""}`.toLowerCase();
      const knownSkills = [
        "verilog", "systemverilog", "vhdl", "rtl", "synthesis", "fpga", "asic",
        "cmos", "vlsi", "embedded", "c", "c++", "python", "matlab", "linux",
        "pcb", "schematic", "layout", "cadence", "synopsys", "mentor", "xilinx",
        "altera", "arm", "risc-v", "microcontroller", "rtos", "git", "docker",
        "analog", "rf", "mixed.signal", "dsp", "control.systems", "power.electronics",
        "signal.integrity", "emi.emc", "testing", "debugging", "documentation",
      ];

      const foundSkills = knownSkills.filter((s) => text.includes(s.replace(".", " ") || s));
      const uniqueSkills = [...new Set(foundSkills)];

      return {
        role: role || opp.title,
        skills: uniqueSkills.length > 0 ? uniqueSkills : ["Refer to opportunity description for specific skills"],
        tools: uniqueSkills.filter((s) =>
          ["cadence", "synopsys", "mentor", "xilinx", "altera", "matlab", "git", "docker"].includes(s)
        ),
        courses: ["BDW Career Roadmap available for this role"],
        estimated_time: "Varies by current skill level",
      };
    }
  }

  const roleSkillMap: Record<string, { skills: string[]; tools: string[] }> = {
    "vlsi design engineer": {
      skills: ["Verilog", "SystemVerilog", "RTL Design", "Synthesis", "Static Timing Analysis", "CMOS VLSI", "Physical Design"],
      tools: ["Cadence Virtuoso", "Synopsys Design Compiler", "Synopsys PrimeTime", "Xilinx Vivado"],
    },
    "embedded systems engineer": {
      skills: ["C", "C++", "Assembly", "RTOS", "ARM Architecture", "Linux Kernel", "Device Drivers"],
      tools: ["Keil", "IAR Embedded Workbench", "STM32CubeIDE", "Git"],
    },
    "fpga engineer": {
      skills: ["Verilog", "SystemVerilog", "FPGA Architecture", "Synthesis", "Timing Closure", "High-Level Synthesis"],
      tools: ["Xilinx Vivado", "Intel Quartus", "ModelSim", "MATLAB/Simulink"],
    },
    "isro scientist/engineer": {
      skills: ["Space Systems", "Orbital Mechanics", "Payload Design", "Communication Systems", "Python", "MATLAB"],
      tools: ["STK", "MATLAB", "ANSYS", "FEKO"],
    },
    "analog design engineer": {
      skills: ["Analog Circuit Design", "RF Design", "Mixed-Signal", "CMOS", "Layout", "SPICE Simulation"],
      tools: ["Cadence Virtuoso", "Spectre", "ADS", "HSPICE"],
    },
  };

  const normalizedRole = role.toLowerCase();
  for (const [key, value] of Object.entries(roleSkillMap)) {
    if (normalizedRole.includes(key) || key.includes(normalizedRole)) {
      return {
        role,
        skills: value.skills,
        tools: value.tools,
        courses: [
          "Check BDW Resources for recommended courses",
          "Visit BDW Career Roadmap for structured learning path",
        ],
        estimated_time: "3-12 months depending on current level",
      };
    }
  }

  return {
    role,
    skills: ["Skills vary by specific role — search for specific opportunities on BDW for detailed requirements"],
    tools: [],
    courses: ["BDW Career Roadmap available for general guidance"],
    estimated_time: "Consult BDW opportunities for role-specific timelines",
  };
}

async function findRelatedOpportunities(
  db: any,
  args: Record<string, unknown>
): Promise<FindRelatedResult> {
  const { opportunity_id, limit = 5 } = args as {
    opportunity_id: string;
    limit?: number;
  };

  const maxLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);

  const { data: seed } = await db
    .from("opportunities")
    .select("id, title, category, organization, location, description, eligibility")
    .eq("id", opportunity_id)
    .single();

  if (!seed) {
    throw new Error(`Opportunity not found: ${opportunity_id}`);
  }

  const terms = [seed.category, seed.organization, seed.title]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .split(/\s+/)
    .filter((t: string) => t.length >= 3);

  if (terms.length === 0) {
    return { opportunities: [], total: 0 };
  }

  const clauses = terms.map((t: string) =>
    `title.ilike.%${escapeILIKE(t)}%,category.ilike.%${escapeILIKE(t)}%,organization.ilike.%${escapeILIKE(t)}%`
  );

  const { data, error } = await db
    .from("opportunities")
    .select("id, title, organization, category, location")
    .eq("is_active", true)
    .neq("verification_status", "rejected")
    .neq("id", opportunity_id)
    .or(clauses.join(","))
    .order("created_at", { ascending: false })
    .limit(maxLimit);

  if (error) throw error;

  const opportunities = (data || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    organization: r.organization,
    category: r.category,
    location: r.location,
    similarity_score: 0.8,
  }));

  return { opportunities, total: opportunities.length };
}

async function getCareerRoadmap(
  args: Record<string, unknown>
): Promise<GetCareerRoadmapResult> {
  const { target_role, current_level = "student", interests = [] } = args as {
    target_role: string;
    current_level?: string;
    interests?: string[];
  };

  const roleLower = target_role.toLowerCase();

  const roadmaps: Record<string, GetCareerRoadmapResult> = {
    "vlsi": {
      target_role: "VLSI Design Engineer",
      steps: [
        { phase: "Foundation", title: "Build Core Knowledge", description: "Master digital electronics, CMOS fundamentals, and semiconductor physics.", skills: ["Digital Logic", "CMOS VLSI", "Semiconductor Physics"], duration: "6-12 months", resources: ["BDW VLSI Career Roadmap", "NPTEL VLSI courses"] },
        { phase: "RTL Skills", title: "Learn Hardware Description Languages", description: "Become proficient in Verilog and SystemVerilog for RTL design.", skills: ["Verilog", "SystemVerilog", "RTL Design"], duration: "3-6 months", resources: ["HDLBits", "Verification Academy"] },
        { phase: "EDA Tools", title: "Master Industry EDA Tools", description: "Learn Synopsys, Cadence, and Mentor tools for synthesis, simulation, and verification.", skills: ["Synopsys DC", "Cadence Virtuoso", "ModelSim"], duration: "3-6 months", resources: ["Free tool licenses for students via Synopsys/Cadence"] },
        { phase: "Specialization", title: "Choose Specialization", description: "Specialize in RTL Design, Verification (DV), Physical Design, or DFT.", skills: ["UVM", "Formal Verification", "STA"], duration: "6-12 months", resources: ["BDW Specialization tracks"] },
        { phase: "Experience", title: "Gain Industry Experience", description: "Apply for internships and entry-level positions at semiconductor companies.", skills: ["Team collaboration", "ASIC flow"], duration: "12+ months", resources: ["BDW Job Board — VLSI Opportunities"] },
      ],
      related_opportunities: [],
    },
    "embedded": {
      target_role: "Embedded Systems Engineer",
      steps: [
        { phase: "Foundation", title: "C Programming & Microcontrollers", description: "Master C language and basic microcontroller programming.", skills: ["C Programming", "Microcontroller Basics", "Electronics Fundamentals"], duration: "3-6 months", resources: ["BDW Embedded Career Roadmap", "Arduino/Raspberry Pi projects"] },
        { phase: "RTOS", title: "Real-Time Operating Systems", description: "Learn FreeRTOS, task scheduling, and real-time concepts.", skills: ["FreeRTOS", "Task Scheduling", "Semaphores/Queues"], duration: "2-4 months", resources: ["FreeRTOS Documentation", "BDW Embedded Internships"] },
        { phase: "Linux", title: "Linux & Device Drivers", description: "Understand Linux kernel, device drivers, and embedded Linux.", skills: ["Linux Kernel", "Device Drivers", "Yocto/Buildroot"], duration: "3-6 months", resources: ["Linux Device Drivers book", "BDW Linux courses"] },
        { phase: "ARM/RISC-V", title: "Processor Architecture", description: "Deep dive into ARM Cortex or RISC-V architecture.", skills: ["ARM Cortex-M", "RISC-V", "Assembly"], duration: "2-4 months", resources: ["ARM Developer documentation"] },
        { phase: "Experience", title: "Industry Internship", description: "Apply for embedded systems internships and entry roles.", skills: ["Board Bring-up", "Debugging"], duration: "12+ months", resources: ["BDW Job Board — Embedded Opportunities"] },
      ],
      related_opportunities: [],
    },
    "isro": {
      target_role: "ISRO Scientist/Engineer",
      steps: [
        { phase: "Academic Foundation", title: "Strong Academic Record", description: "Complete B.Tech/M.Tech with excellent grades (preferably 1st class).", skills: ["Core Electronics/CS", "Mathematics", "Problem Solving"], duration: "4-6 years", resources: ["IIT/IISc research exposure"] },
        { phase: "GATE Preparation", title: "Crack GATE/ISRO Exam", description: "Prepare for GATE (for JRF/SRF) or ISRO's own recruitment exam.", skills: ["GATE Syllabus", "ISRO Exam Pattern", "Mock Tests"], duration: "6-12 months", resources: ["BDW GATE Preparation Resources"] },
        { phase: "Research Exposure", title: "Research Internship", description: "Apply for ISRO research internships (SAC, URSC, ISTRAC).", skills: ["Research Methodology", "Technical Writing"], duration: "3-6 months", resources: ["BDW ISRO Internship Listings"] },
        { phase: "Specialization", title: "Choose ISRO Centre", description: "Specialize in Space Communication, Propulsion, Avionics, or Payload Design.", skills: ["Domain Expertise", "ISRO Technologies"], duration: "2-3 years", resources: ["ISRO Centre information on BDW"] },
        { phase: "Career Entry", title: "Apply for Scientist/Engineer Posts", description: "Apply through ISRO recruitment ( Scientist/Engineer 'SC' / 'SD' / 'SE').", skills: ["Interview Preparation", "Technical Depth"], duration: "Ongoing", resources: ["BDW ISRO Job Listings"] },
      ],
      related_opportunities: [],
    },
  };

  for (const [key, roadmap] of Object.entries(roadmaps)) {
    if (roleLower.includes(key) || key.includes(roleLower)) {
      return roadmap;
    }
  }

  return {
    target_role,
    steps: [
      { phase: "Foundation", title: "Build Core Knowledge", description: `Learn the fundamentals of ${target_role}`, skills: interests.length > 0 ? interests : ["Domain fundamentals"], duration: "6-12 months", resources: ["BDW Career Resources"] },
      { phase: "Skill Development", title: "Develop Specialized Skills", description: `Acquire skills specific to ${target_role}`, skills: ["Domain-specific skills"], duration: "3-6 months", resources: ["BDW Skill Gap Analysis"] },
      { phase: "Experience", title: "Gain Practical Experience", description: "Apply for internships and entry-level positions", skills: ["Practical application"], duration: "6-12 months", resources: ["BDW Job Board"] },
    ],
    related_opportunities: [],
  };
}

async function searchNews(
  db: any,
  args: Record<string, unknown>
): Promise<SearchNewsResult> {
  const { query = "", limit = 5 } = args as {
    query?: string;
    limit?: number;
  };

  const maxLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);
  let qb = db
    .from("news_articles")
    .select("id, title, summary, published_at, url, slug, tags");

  if (query) {
    const terms = query.toLowerCase().split(/\s+/).filter((t: string) => t.length >= 2);
    if (terms.length > 0) {
      const clauses = terms.map((t: string) =>
        `title.ilike.%${escapeILIKE(t)}%,summary.ilike.%${escapeILIKE(t)}%`
      );
      qb = qb.or(clauses.join(","));
    }
  }

  qb = qb.order("published_at", { ascending: false }).limit(maxLimit);

  const { data, error } = await qb;
  if (error) throw error;

  const news = (data || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    published_at: r.published_at,
    source_url: r.url || null,
  }));

  return { news, total: news.length };
}
