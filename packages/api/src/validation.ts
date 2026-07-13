import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const filterSchema = z.object({
  category: z.string().optional(),
  location: z.string().optional(),
  deadline: z.string().optional(),
  verified: z.enum(["all", "true", "false"]).optional(),
  search: z.string().max(100).optional(),
});

export const opportunityListQuerySchema = paginationSchema.merge(filterSchema);

export const searchQuerySchema = z.object({
  q: z.string().max(200).default(""),
  category: z.string().optional(),
  location: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const bookmarkSchema = z.object({
  opportunityId: z.string().uuid(),
});

export const feedPostSchema = z.object({
  content: z.string().min(1).max(10000),
  type: z.enum(["post", "article", "announcement", "opportunity_share", "achievement", "question"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  opportunityId: z.string().uuid().optional(),
  articleTitle: z.string().max(300).optional(),
  articleCoverUrl: z.string().url().optional(),
  visibility: z.enum(["public", "connections", "followers"]).default("public"),
});

export const connectionRequestSchema = z.object({
  receiverId: z.string().uuid(),
  message: z.string().max(500).optional(),
});

export const connectionResponseSchema = z.object({
  status: z.enum(["accepted", "declined", "withdrawn"]),
});

export const messageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  participantId: z.string().uuid().optional(),
  content: z.string().min(1).max(5000),
});

export const profileUpdateSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  displayName: z.string().max(100).optional(),
  headline: z.string().max(200).optional(),
  about: z.string().max(5000).optional(),
  avatarUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  currentPosition: z.string().max(200).optional(),
  currentOrg: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  websiteUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  skills: z.array(z.string().max(100)).max(50).optional(),
  isOpenToWork: z.boolean().optional(),
  openToWorkTypes: z.array(z.string()).max(10).optional(),
  isProfilePublic: z.boolean().optional(),
});

export const resumeSchema = z.object({
  fullName: z.string().max(200).optional(),
  headline: z.string().max(300).optional(),
  summary: z.string().max(5000).optional(),
  location: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  education: z.array(z.any()).max(20).optional(),
  experience: z.array(z.any()).max(20).optional(),
  projects: z.array(z.any()).max(20).optional(),
  skills: z.array(z.string().max(100)).max(50).optional(),
});

export const subscribeSchema = z.object({
  email: z.string().email().max(200),
  keywords: z.array(z.string().max(100)).max(20).optional(),
  categories: z.array(z.string().max(100)).max(10).optional(),
  locations: z.array(z.string().max(100)).max(10).optional(),
});

export const reportIssueSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  email: z.string().email().max(200).optional(),
});

export const reportOpportunitySchema = z.object({
  opportunityId: z.string().uuid(),
  reportType: z.enum(["broken_link", "wrong_info", "expired", "duplicate", "other"]),
  description: z.string().max(500).optional(),
});

export const aiChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().min(1).max(10000),
  })).min(1).max(50),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(1).max(8192).optional(),
});

export const aiEnhanceSchema = z.object({
  action: z.enum(["expand", "summarize", "rewrite", "improve", "keywords"]),
  sectionType: z.enum(["summary", "experience", "project", "skill", "education"]),
  content: z.any(),
});

export const scrapeSourceSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  type: z.enum(["rss_news", "rss_opportunities", "html_careers", "api", "html"]),
  companyId: z.string().uuid().optional(),
  country: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  scrapeFrequency: z.enum(["hourly", "daily", "weekly"]).optional(),
  config: z.record(z.string(), z.any()).optional(),
});

export const adminOpportunityUpdateSchema = z.object({
  title: z.string().min(3).max(300).optional(),
  organization: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  location: z.string().max(200).optional(),
  stipend: z.string().max(100).optional(),
  deadline: z.string().max(50).nullable().optional(),
  eligibility: z.string().max(500).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  applyLink: z.string().url().max(1000).nullable().optional(),
  sourceUrl: z.string().url().max(1000).nullable().optional(),
  applyLinkType: z.enum(["direct", "homepage", "pdf", "email", "portal"]).optional(),
  verificationStatus: z.enum(["verified", "pending", "rejected", "expired", "link_unavailable"]).optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  adminNotes: z.string().max(2000).optional(),
});

export const adminOrganizationSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  type: z.enum(["Government PSU", "Research Lab", "Central University", "IIT/NIT", "Private MNC", "Private Indian", "Startup", "International University", "International Research Lab", "International Company"]),
  country: z.string().max(100).default("India"),
  headquarters: z.string().max(200).optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  foundedYear: z.number().int().min(1800).max(2100).optional(),
  employeeCountRange: z.string().max(50).optional(),
  specialties: z.array(z.string().max(100)).max(20).optional(),
  industry: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
  isVerified: z.boolean().default(false),
  isAutoScraped: z.boolean().default(true),
  scrapeFrequency: z.enum(["hourly", "daily", "weekly"]).default("daily"),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error(first?.message || "Validation failed");
  }
  return result.data;
}

export function validatePartial<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  data: unknown
): Partial<Record<keyof T, unknown>> {
  const result = schema.partial().safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error(first?.message || "Validation failed");
  }
  return result.data as Partial<Record<keyof T, unknown>>;
}