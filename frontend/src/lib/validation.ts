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
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username may only contain letters, numbers, underscores, and hyphens")
    .optional(),
  display_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).optional(),
  headline: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  skills: z.array(z.string().max(100)).max(50).optional(),
  interests: z.array(z.string().max(100)).max(20).optional(),
  linkedin_url: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  github_url: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  website_url: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  avatar_url: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
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
  participantId: z.string().uuid().optional(),
  recipientId: z.string().uuid().optional(),
  recipient_id: z.string().uuid().optional(),
  participant_id: z.string().uuid().optional(),
  content: z.string().min(1).max(5000),
}).refine((data) => Boolean(data.participantId || data.recipientId || data.recipient_id || data.participant_id), {
  message: "participantId or recipientId is required",
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
  // P0.5: live CHECK constraint allows only these values (verified 2026-08-16).
  verification_status: z.enum(["verified", "pending", "rejected", "link_unavailable", "expired"]).optional(),
  is_active: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  admin_notes: z.string().max(2000).optional(),
});

// P0.5: admin create-organization body, matched to LIVE organizations columns
// (verified 2026-08-16; the old schema carried dead columns like
// `headquarters`/`founded_year` that 400'd on PostgREST). strict() rejects any
// unknown key — mass-assignment defense for the raw-body admin route.
export const organizationCreateSchema = z
  .object({
    name: z.string().min(1).max(200),
    slug: z.string().min(1).max(100).optional(),
    type: z.string().max(50).optional(),
    country: z.string().max(100).optional(),
    location: z.string().max(200).optional(),
    website: z.string().url().max(500).optional(),
    careers_url: z.string().url().max(500).optional(),
    logo_url: z.string().url().max(500).optional(),
    description: z.string().max(2000).optional(),
    is_verified: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

// P0.5: employer application-status update body. Whitelist matches the live
// lifecycle: `applied` (POST default) + the admin STATUS_FLOW values.
export const applicationStatusUpdateSchema = z.object({
  status: z
    .enum(["applied", "submitted", "reviewed", "shortlisted", "accepted", "rejected"])
    .optional(),
  notes: z.string().max(2000).optional(),
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

// P0.5: legacy admin form fields (organization text, stipend, apply_link,
// apply_link_type) → live opportunities columns (organization_id via the
// caller, salary_range, apply_url). `organization` text is dropped here.
// Empty edit-form fields are skipped so they never clobber stored values;
// on create, apply_url defaults to "" (NOT NULL) and salary_range to null.
export function mapAdminOpportunityColumns(data: Record<string, unknown>, forCreate = false): Record<string, unknown> {
  const { organization, stipend, apply_link, apply_link_type, ...rest } = data;
  const out: Record<string, unknown> = { ...rest };
  if (stipend && String(stipend).trim()) out.salary_range = stipend;
  if (apply_link && String(apply_link).trim()) out.apply_url = apply_link;
  if (forCreate) {
    out.salary_range = out.salary_range ?? null;
    out.apply_url = out.apply_url ?? "";
  }
  return out;
}
