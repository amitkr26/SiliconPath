import { createSupabaseServer } from "../auth/server.js";

export interface EducationItem { institution?: string; degree?: string; field?: string; start?: string; end?: string; grade?: string; }
export interface ExperienceItem { org?: string; title?: string; start?: string; end?: string; summary?: string; tools?: string[]; }
export interface ProjectItem { name?: string; summary?: string; link?: string; }
export interface PublicationItem { title?: string; venue?: string; year?: string; link?: string; }

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  headline: string | null;
  location: string | null;
  about: string | null;
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: string[];
  projects: ProjectItem[];
  publications: PublicationItem[];
  fab_tool_experience: string[];
  patents: unknown[];
  pi_lab_affiliation: string | null;
  gate_net_status: string | null;
}

/**
 * Reads the current user's canonical profile. This is the SAME data the resume
 * builder edits — one source of truth, no copy, no sync.
 */
export async function getMyProfile(): Promise<UserProfile | null> {
  const supabase = createSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (error) throw new Error(`[data] getMyProfile failed: ${error.message}`);
  return (data as UserProfile) ?? null;
}

/** Partial update of canonical fields. RLS guarantees own-row-only. */
export async function updateMyProfile(patch: Partial<UserProfile>): Promise<void> {
  const supabase = createSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("[data] updateMyProfile: not authenticated");

  const { error } = await supabase
    .from("user_profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", userData.user.id);
  if (error) throw new Error(`[data] updateMyProfile failed: ${error.message}`);
}
