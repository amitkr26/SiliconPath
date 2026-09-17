/**
 * BDW AI Tool Definitions
 *
 * Structured tools the AI model can call to answer user questions.
 * Format: OpenAI function-calling schema (compatible with OpenAI-compatible endpoints).
 *
 * Tool execution lives server-side in /api/ai/bdw-tools/route.ts.
 * This file defines the schemas — shared between the system prompt and the tool router.
 */

export type BDWToolName =
  | "search_opportunities"
  | "search_organizations"
  | "check_eligibility"
  | "get_required_skills"
  | "find_related_opportunities"
  | "get_career_roadmap"
  | "search_news";

export interface BDWToolDefinition {
  type: "function";
  function: {
    name: BDWToolName;
    description: string;
    parameters: Record<string, unknown>;
  };
}

// ─── Tool Schemas ──────────────────────────────────────────────────────────

export const BDW_TOOLS: BDWToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "search_opportunities",
      description:
        "Search BDW's verified database of deep-tech research and career opportunities. " +
        "Use this when the user asks about specific openings, internships, fellowships, or jobs.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search keywords (e.g. 'VLSI internship Bangalore')" },
          category: {
            type: "string",
            enum: ["jrf", "srf", "phd", "internship", "fellowship", "scholarship", "government", "postdoc"],
            description: "Opportunity category filter",
          },
          field: {
            type: "string",
            enum: ["vlsi", "embedded", "semiconductor", "analog", "fpga", "any"],
            description: "Technical field filter",
          },
          location: { type: "string", description: "City or 'remote' (e.g. 'Bengaluru', 'Hyderabad')" },
          eligibility: {
            type: "string",
            enum: ["B.Tech", "M.Tech", "PhD", "B.Sc", "M.Sc", "Diploma", "any"],
            description: "Minimum qualification filter",
          },
          limit: { type: "integer", description: "Max results (default 5, max 10)", default: 5 },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_organizations",
      description:
        "Search BDW's verified database of organizations (labs, institutions, companies). " +
        "Use when the user asks about a specific company, lab, or research institute.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Organization name or type (e.g. 'ISRO', 'IIT', 'VLSI company')" },
          type: {
            type: "string",
            enum: ["government_lab", "psu", "private", "academic", "startup", "any"],
            description: "Organization type filter",
          },
          limit: { type: "integer", description: "Max results (default 5, max 10)", default: 5 },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_eligibility",
      description:
        "Check if a user profile qualifies for a specific opportunity. " +
        "Use when the user asks 'can I apply?', 'am I eligible?', or 'what do I need?'",
      parameters: {
        type: "object",
        properties: {
          opportunity_id: { type: "string", description: "BDW opportunity UUID" },
          user_degree: { type: "string", description: "User's degree (e.g. 'B.Tech', 'M.Sc')" },
          user_branch: { type: "string", description: "User's branch (e.g. 'Electronics', 'CS')" },
          user_skills: {
            type: "array",
            items: { type: "string" },
            description: "User's listed skills",
          },
        },
        required: ["opportunity_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_required_skills",
      description:
        "Get the skills, tools, and knowledge required for a role or field. " +
        "Use when the user asks 'what skills do I need?' or 'what should I learn for VLSI?'",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string", description: "Target role or field (e.g. 'VLSI Design Engineer', 'Embedded Systems')" },
          opportunity_id: { type: "string", description: "Optional: specific BDW opportunity UUID to extract skills from" },
        },
        required: ["role"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_related_opportunities",
      description:
        "Find opportunities similar to a given one. " +
        "Use when the user says 'show me more like this' or 'similar roles'.",
      parameters: {
        type: "object",
        properties: {
          opportunity_id: { type: "string", description: "BDW opportunity UUID to find similar ones for" },
          limit: { type: "integer", description: "Max results (default 5, max 10)", default: 5 },
        },
        required: ["opportunity_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_career_roadmap",
      description:
        "Generate a structured career roadmap for deep-tech hardware careers. " +
        "Use when the user asks 'how to become a VLSI engineer?' or 'career path in semiconductors'.",
      parameters: {
        type: "object",
        properties: {
          target_role: { type: "string", description: "Target career role (e.g. 'VLSI Design Engineer', 'ISRO Scientist')" },
          current_level: {
            type: "string",
            enum: ["student", "graduate", "early_career", "mid_career"],
            description: "User's current career stage",
          },
          interests: {
            type: "array",
            items: { type: "string" },
            description: "User's specific interests within the domain",
          },
        },
        required: ["target_role"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_news",
      description:
        "Search BDW's curated news and announcements. " +
        "Use when the user asks about latest developments, announcements, or industry news.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search keywords (e.g. 'ISRO announcement', 'semiconductor policy')" },
          limit: { type: "integer", description: "Max results (default 5, max 10)", default: 5 },
        },
        required: [],
      },
    },
  },
];

/**
 * Get a tool definition by name.
 */
export function getToolByName(name: BDWToolName): BDWToolDefinition | undefined {
  return BDW_TOOLS.find((t) => t.function.name === name);
}

/**
 * Format tool definitions for injection into the system prompt.
 * This tells the AI what tools are available and how to call them.
 */
export function formatToolsForPrompt(): string {
  const lines: string[] = [
    "\n=== AVAILABLE TOOLS ===",
    "You have access to the following tools. Call them using the <tool_call> format:",
    "",
    '<tool_call name="tool_name" arguments={"arg1": "value1"} />',
    "",
    "Available tools:",
  ];

  for (const tool of BDW_TOOLS) {
    lines.push(`- ${tool.function.name}: ${tool.function.description}`);
    const params = tool.function.parameters as any;
    if (params.properties && Object.keys(params.properties).length > 0) {
      lines.push(`  Parameters: ${Object.keys(params.properties).join(", ")}`);
    }
  }

  lines.push("");
  lines.push("Rules for tool calls:");
  lines.push("1. You may call multiple tools in a single response (up to 3).");
  lines.push("2. Tool calls are executed server-side and results appear in RETRIEVED_DATA.");
  lines.push("3. After receiving tool results, reason over them and provide your final answer.");
  lines.push("4. Never fabricate tool results — wait for actual data.");
  lines.push("5. Only call tools that are relevant to the user's question.");

  return lines.join("\n");
}

// ─── Tool Result Types ─────────────────────────────────────────────────────

export interface ToolResult {
  tool: BDWToolName;
  success: boolean;
  data: unknown;
  error?: string;
}

export interface SearchOpportunitiesResult {
  opportunities: Array<{
    id: string;
    title: string;
    organization: string | null;
    category: string | null;
    location: string | null;
    deadline: string | null;
    stipend: string | null;
    eligibility: string | null;
    apply_url: string | null;
    slug: string | null;
    verification_status: string | null;
  }>;
  total: number;
}

export interface SearchOrganizationsResult {
  organizations: Array<{
    id: string;
    name: string;
    type: string | null;
    location: string | null;
    website: string | null;
    opportunity_count: number;
  }>;
  total: number;
}

export interface CheckEligibilityResult {
  opportunity: {
    id: string;
    title: string;
    eligibility: string | null;
    category: string | null;
    deadline: string | null;
  };
  eligible: boolean;
  matched: string[];
  missing: string[];
  recommendations: string[];
}

export interface GetRequiredSkillsResult {
  role: string;
  skills: string[];
  tools: string[];
  courses: string[];
  estimated_time: string;
}

export interface FindRelatedResult {
  opportunities: Array<{
    id: string;
    title: string;
    organization: string | null;
    category: string | null;
    location: string | null;
    similarity_score: number;
  }>;
  total: number;
}

export interface GetCareerRoadmapResult {
  target_role: string;
  steps: Array<{
    phase: string;
    title: string;
    description: string;
    skills: string[];
    duration: string;
    resources: string[];
  }>;
  related_opportunities: Array<{
    id: string;
    title: string;
    organization: string | null;
    category: string | null;
  }>;
}

export interface SearchNewsResult {
  news: Array<{
    id: string;
    title: string;
    summary: string | null;
    published_at: string | null;
    source_url: string | null;
  }>;
  total: number;
}
