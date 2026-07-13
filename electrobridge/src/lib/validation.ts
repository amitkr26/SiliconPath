import { z } from "zod";

export const opportunitySchema = z.object({
  title: z.string().min(3).max(300),
  organization: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  location: z.string().max(200).nullable().default(null),
  stipend: z.string().max(100).nullable().default(null),
  deadline: z.string().max(50).nullable().default(null),
  eligibility: z.string().max(500).nullable().default(null),
  description: z.string().max(5000).nullable().default(null),
  apply_link: z.string().url().max(1000).nullable().default(null),
  source_url: z.string().url().max(1000).nullable().default(null),
  source_type: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const profileUpdateSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).optional(),
  headline: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  skills: z.array(z.string().max(100)).max(50).optional(),
  interests: z.array(z.string().max(100)).max(20).optional(),
  linkedin_url: z.string().url().max(500).optional(),
  github_url: z.string().url().max(500).optional(),
  website_url: z.string().url().max(500).optional(),
  avatar_url: z.string().url().max(500).optional(),
  experience_years: z.number().int().min(0).max(70).optional(),
  job_title: z.string().max(200).optional(),
  current_company: z.string().max(200).optional(),
});

export const communityPostSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(10000),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const communityCommentSchema = z.object({
  post_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export const messageSchema = z.object({
  participantId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export const messageReplySchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export const aiEnhanceSchema = z.object({
  action: z.string().max(50).optional(),
  sectionType: z.string().min(1).max(50),
  content: z.any(),
});

export const feedPostSchema = z.object({
  content: z.string().min(1).max(10000),
  type: z.enum(["post", "article", "announcement"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const subscribeSchema = z.object({
  email: z.string().email().max(200),
  keywords: z.array(z.string().max(100)).max(20).optional(),
  categories: z.array(z.string().max(100)).max(10).optional(),
});

export const reportIssueSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  email: z.string().email().max(200).optional(),
});

export const reportOpportunitySchema = z.object({
  opportunity_id: z.string().uuid(),
  report_type: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
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
  apply_link: z.string().url().max(1000).nullable().optional(),
  source_url: z.string().url().max(1000).nullable().optional(),
  apply_link_type: z.enum(["direct", "homepage", "pdf", "email", "portal"]).optional(),
  verification_status: z.enum(["verified", "pending", "rejected", "expired", "link_unavailable"]).optional(),
  is_active: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  admin_notes: z.string().max(2000).optional(),
});

export const adminOrganizationSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  type: z.enum(["Government PSU", "Research Lab", "Central University", "IIT/NIT", "Private MNC", "Private Indian", "Startup", "International University", "International Research Lab", "International Company"]),
  country: z.string().max(100).default("India"),
  headquarters: z.string().max(200).optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  founded_year: z.number().int().min(1800).max(2100).optional(),
  employee_count_range: z.string().max(50).optional(),
  specialties: z.array(z.string().max(100)).max(20).optional(),
  industry: z.string().max(100).optional(),
  is_active: z.boolean().default(true),
  is_verified: z.boolean().default(false),
  is_auto_scraped: z.boolean().default(true),
  scrape_frequency: z.enum(["hourly", "daily", "weekly"]).default("daily"),
});

export const resumeSchema = z.object({
  full_name: z.string().max(200).optional(),
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

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error(first?.message || "Validation failed");
  }
  return result.data;
}
