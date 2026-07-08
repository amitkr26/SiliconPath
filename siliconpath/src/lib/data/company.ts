import { getDB } from "../db/index.js";
import { createSupabaseServer } from "../auth/server.js";

export interface Company {
  id: string;
  name: string;
  slug: string | null;
  type: string | null;
  domain: string | null;
  logo_url: string | null;
  description: string | null;
}

export async function listCompanies(): Promise<Company[]> {
  const { client } = getDB("core");
  const { data, error } = await client.from("companies").select("*").order("name");
  if (error) throw new Error(`[data] listCompanies failed: ${error.message}`);
  return (data ?? []) as Company[];
}

export async function getCompany(id: string): Promise<Company | null> {
  const { client } = getDB("core");
  const { data, error } = await client.from("companies").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`[data] getCompany failed: ${error.message}`);
  return (data as Company) ?? null;
}

/**
 * Submit a claim for a company page. Domain check: the work email's domain must
 * match the company's known domain (when we have one). Verification of the email
 * itself (send + confirm link) is a follow-up; this records the intent + does the
 * structural domain match so a claim for the wrong domain is rejected up front.
 */
export async function submitCompanyClaim(companyId: string, workEmail: string): Promise<{ ok: boolean; reason?: string }> {
  const supabase = createSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("[data] submitCompanyClaim: not authenticated");

  const company = await getCompany(companyId);
  if (!company) return { ok: false, reason: "company-not-found" };

  const emailDomain = workEmail.split("@")[1]?.toLowerCase().trim();
  if (!emailDomain) return { ok: false, reason: "invalid-email" };
  if (company.domain && !emailDomain.endsWith(company.domain.toLowerCase())) {
    return { ok: false, reason: "domain-mismatch" };
  }

  const { error } = await supabase
    .from("company_claims")
    .insert({ company_id: companyId, user_id: userData.user.id, work_email: workEmail });
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

/** Employer job posting → feeds the SAME opportunities table, tagged employer_posted. */
export async function postEmployerJob(input: {
  companyName: string;
  title: string;
  category: string;
  location?: string;
  deadline?: string;
  eligibility?: string;
  description: string;
  applyLink: string;
}): Promise<void> {
  const supabase = createSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("[data] postEmployerJob: not authenticated");

  // Uses the user's RLS-scoped client; an INSERT policy on opportunities for
  // employer_posted rows should restrict this to verified claimants (see notes).
  const { error } = await supabase.from("opportunities").insert({
    title: input.title,
    organization: input.companyName,
    category: input.category,
    location: input.location ?? null,
    deadline: input.deadline ?? null,
    eligibility: input.eligibility ?? null,
    description: input.description,
    apply_link: input.applyLink,
    source_url: input.applyLink,
    source_type: "employer_posted",
    tags: [input.category],
    is_active: true,
  });
  if (error) throw new Error(`[data] postEmployerJob failed: ${error.message}`);
}
