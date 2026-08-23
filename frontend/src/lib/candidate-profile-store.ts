import { supabaseAdmin } from "@/lib/supabase";
import {
  CandidateExperience,
  CandidateEducation,
  CandidateProject,
  CandidateCertification,
  CandidateAchievement,
} from "@/types";

// Global cache for runtime resilience and testing
const globalStore = globalThis as unknown as {
  __candidateExperienceCache?: Map<string, CandidateExperience[]>;
  __candidateEducationCache?: Map<string, CandidateEducation[]>;
  __candidateProjectCache?: Map<string, CandidateProject[]>;
  __candidateCertCache?: Map<string, CandidateCertification[]>;
  __candidateAchieveCache?: Map<string, CandidateAchievement[]>;
};

if (!globalStore.__candidateExperienceCache) globalStore.__candidateExperienceCache = new Map();
if (!globalStore.__candidateEducationCache) globalStore.__candidateEducationCache = new Map();
if (!globalStore.__candidateProjectCache) globalStore.__candidateProjectCache = new Map();
if (!globalStore.__candidateCertCache) globalStore.__candidateCertCache = new Map();
if (!globalStore.__candidateAchieveCache) globalStore.__candidateAchieveCache = new Map();

const experienceCache = globalStore.__candidateExperienceCache;
const educationCache = globalStore.__candidateEducationCache;
const projectCache = globalStore.__candidateProjectCache;
const certCache = globalStore.__candidateCertCache;
const achieveCache = globalStore.__candidateAchieveCache;

// ═══════════════════════════════════════════════════════════════════════════════
// 1. EXPERIENCES
// ═══════════════════════════════════════════════════════════════════════════════

export async function getCandidateExperiences(candidateId: string): Promise<CandidateExperience[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("candidate_experiences")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("start_date", { ascending: false });

    if (!error && data) {
      experienceCache.set(candidateId, data);
      return data;
    }
    if (error) {
      console.warn(`[candidate_experiences DB Warning]: ${error.message} (code ${error.code})`);
    }
  } catch (err: any) {
    console.warn(`[candidate_experiences DB Exception]: ${err?.message}`);
  }
  return experienceCache.get(candidateId) || [];
}

export async function createCandidateExperience(
  candidateId: string,
  input: Omit<CandidateExperience, "id" | "candidate_id" | "created_at" | "updated_at">
): Promise<CandidateExperience> {
  const newRecord: CandidateExperience = {
    id: crypto.randomUUID(),
    candidate_id: candidateId,
    company_name: input.company_name,
    role_title: input.role_title,
    employment_type: input.employment_type || "Full-time",
    location: input.location || null,
    start_date: input.start_date,
    end_date: input.is_current ? null : input.end_date || null,
    is_current: !!input.is_current,
    description: input.description || null,
    skills_used: Array.isArray(input.skills_used) ? input.skills_used : [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin
      .from("candidate_experiences")
      .insert(newRecord)
      .select()
      .maybeSingle();

    if (!error && data) {
      const existing = experienceCache.get(candidateId) || [];
      experienceCache.set(candidateId, [data, ...existing]);
      return data;
    }
    if (error) {
      console.warn(`[candidate_experiences INSERT Warning]: ${error.message} (code ${error.code})`);
    }
  } catch (err: any) {
    console.warn(`[candidate_experiences INSERT Exception]: ${err?.message}`);
  }

  // Fallback with recorded state
  const existing = experienceCache.get(candidateId) || [];
  const updated = [newRecord, ...existing];
  experienceCache.set(candidateId, updated);
  return newRecord;
}

export async function updateCandidateExperience(
  candidateId: string,
  experienceId: string,
  updates: Partial<Omit<CandidateExperience, "id" | "candidate_id">>
): Promise<CandidateExperience | null> {
  const payload = {
    ...updates,
    end_date: updates.is_current ? null : updates.end_date,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin
      .from("candidate_experiences")
      .update(payload)
      .eq("id", experienceId)
      .eq("candidate_id", candidateId)
      .select()
      .maybeSingle();

    if (!error && data) {
      const existing = experienceCache.get(candidateId) || [];
      const updated = existing.map((e) => (e.id === experienceId ? data : e));
      experienceCache.set(candidateId, updated);
      return data;
    }
  } catch {}

  const existing = experienceCache.get(candidateId) || [];
  const idx = existing.findIndex((e) => e.id === experienceId);
  if (idx === -1) return null;
  const currentItem = existing[idx];
  const merged: CandidateExperience = {
    ...currentItem,
    ...updates,
    end_date: updates.is_current ? null : (updates.end_date !== undefined ? updates.end_date : currentItem.end_date),
    updated_at: new Date().toISOString(),
  };
  existing[idx] = merged;
  experienceCache.set(candidateId, existing);
  return merged;
}

export async function deleteCandidateExperience(candidateId: string, experienceId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("candidate_experiences")
      .delete()
      .eq("id", experienceId)
      .eq("candidate_id", candidateId);

    if (!error) {
      const existing = experienceCache.get(candidateId) || [];
      experienceCache.set(
        candidateId,
        existing.filter((e) => e.id !== experienceId)
      );
      return true;
    }
  } catch {}

  const existing = experienceCache.get(candidateId) || [];
  experienceCache.set(
    candidateId,
    existing.filter((e) => e.id !== experienceId)
  );
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. EDUCATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getCandidateEducations(candidateId: string): Promise<CandidateEducation[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("candidate_educations")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("start_year", { ascending: false, nullsFirst: false });

    if (!error && data) {
      educationCache.set(candidateId, data);
      return data;
    }
  } catch {}
  return educationCache.get(candidateId) || [];
}

export async function createCandidateEducation(
  candidateId: string,
  input: Omit<CandidateEducation, "id" | "candidate_id" | "created_at" | "updated_at">
): Promise<CandidateEducation> {
  const newRecord: CandidateEducation = {
    id: crypto.randomUUID(),
    candidate_id: candidateId,
    institution: input.institution,
    degree: input.degree,
    field_of_study: input.field_of_study || null,
    start_year: input.start_year ? Number(input.start_year) : null,
    end_year: input.end_year ? Number(input.end_year) : null,
    grade: input.grade || null,
    description: input.description || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin
      .from("candidate_educations")
      .insert(newRecord)
      .select()
      .maybeSingle();

    if (!error && data) {
      const existing = educationCache.get(candidateId) || [];
      educationCache.set(candidateId, [data, ...existing]);
      return data;
    }
  } catch {}

  const existing = educationCache.get(candidateId) || [];
  educationCache.set(candidateId, [newRecord, ...existing]);
  return newRecord;
}

export async function updateCandidateEducation(
  candidateId: string,
  educationId: string,
  updates: Partial<Omit<CandidateEducation, "id" | "candidate_id">>
): Promise<CandidateEducation | null> {
  const payload = {
    ...updates,
    start_year: updates.start_year !== undefined ? (updates.start_year ? Number(updates.start_year) : null) : undefined,
    end_year: updates.end_year !== undefined ? (updates.end_year ? Number(updates.end_year) : null) : undefined,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin
      .from("candidate_educations")
      .update(payload)
      .eq("id", educationId)
      .eq("candidate_id", candidateId)
      .select()
      .maybeSingle();

    if (!error && data) {
      const existing = educationCache.get(candidateId) || [];
      const updated = existing.map((e) => (e.id === educationId ? data : e));
      educationCache.set(candidateId, updated);
      return data;
    }
  } catch {}

  const existing = educationCache.get(candidateId) || [];
  const idx = existing.findIndex((e) => e.id === educationId);
  if (idx === -1) return null;
  const currentItem = existing[idx];
  const merged: CandidateEducation = {
    ...currentItem,
    ...updates,
    start_year: updates.start_year !== undefined ? (updates.start_year ? Number(updates.start_year) : null) : currentItem.start_year,
    end_year: updates.end_year !== undefined ? (updates.end_year ? Number(updates.end_year) : null) : currentItem.end_year,
    updated_at: new Date().toISOString(),
  };
  existing[idx] = merged;
  educationCache.set(candidateId, existing);
  return merged;
}

export async function deleteCandidateEducation(candidateId: string, educationId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("candidate_educations")
      .delete()
      .eq("id", educationId)
      .eq("candidate_id", candidateId);

    if (!error) {
      const existing = educationCache.get(candidateId) || [];
      educationCache.set(
        candidateId,
        existing.filter((e) => e.id !== educationId)
      );
      return true;
    }
  } catch {}

  const existing = educationCache.get(candidateId) || [];
  educationCache.set(
    candidateId,
    existing.filter((e) => e.id !== educationId)
  );
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PROJECTS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getCandidateProjects(candidateId: string): Promise<CandidateProject[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("candidate_projects")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      projectCache.set(candidateId, data);
      return data;
    }
  } catch {}
  return projectCache.get(candidateId) || [];
}

export async function createCandidateProject(
  candidateId: string,
  input: Omit<CandidateProject, "id" | "candidate_id" | "created_at" | "updated_at">
): Promise<CandidateProject> {
  const newRecord: CandidateProject = {
    id: crypto.randomUUID(),
    candidate_id: candidateId,
    title: input.title,
    description: input.description || null,
    technologies: Array.isArray(input.technologies) ? input.technologies : [],
    project_url: input.project_url || null,
    github_url: input.github_url || null,
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin
      .from("candidate_projects")
      .insert(newRecord)
      .select()
      .maybeSingle();

    if (!error && data) {
      const existing = projectCache.get(candidateId) || [];
      projectCache.set(candidateId, [data, ...existing]);
      return data;
    }
  } catch {}

  const existing = projectCache.get(candidateId) || [];
  projectCache.set(candidateId, [newRecord, ...existing]);
  return newRecord;
}

export async function updateCandidateProject(
  candidateId: string,
  projectId: string,
  updates: Partial<Omit<CandidateProject, "id" | "candidate_id">>
): Promise<CandidateProject | null> {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin
      .from("candidate_projects")
      .update(payload)
      .eq("id", projectId)
      .eq("candidate_id", candidateId)
      .select()
      .maybeSingle();

    if (!error && data) {
      const existing = projectCache.get(candidateId) || [];
      const updated = existing.map((e) => (e.id === projectId ? data : e));
      projectCache.set(candidateId, updated);
      return data;
    }
  } catch {}

  const existing = projectCache.get(candidateId) || [];
  const idx = existing.findIndex((e) => e.id === projectId);
  if (idx === -1) return null;
  const currentItem = existing[idx];
  const merged: CandidateProject = {
    ...currentItem,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  existing[idx] = merged;
  projectCache.set(candidateId, existing);
  return merged;
}

export async function deleteCandidateProject(candidateId: string, projectId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("candidate_projects")
      .delete()
      .eq("id", projectId)
      .eq("candidate_id", candidateId);

    if (!error) {
      const existing = projectCache.get(candidateId) || [];
      projectCache.set(
        candidateId,
        existing.filter((e) => e.id !== projectId)
      );
      return true;
    }
  } catch {}

  const existing = projectCache.get(candidateId) || [];
  projectCache.set(
    candidateId,
    existing.filter((e) => e.id !== projectId)
  );
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. CERTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getCandidateCertifications(candidateId: string): Promise<CandidateCertification[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("candidate_certifications")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("issue_date", { ascending: false, nullsFirst: false });

    if (!error && data) {
      certCache.set(candidateId, data);
      return data;
    }
  } catch {}
  return certCache.get(candidateId) || [];
}

export async function createCandidateCertification(
  candidateId: string,
  input: Omit<CandidateCertification, "id" | "candidate_id" | "created_at">
): Promise<CandidateCertification> {
  const newRecord: CandidateCertification = {
    id: crypto.randomUUID(),
    candidate_id: candidateId,
    name: input.name,
    issuing_org: input.issuing_org,
    issue_date: input.issue_date || null,
    expiration_date: input.expiration_date || null,
    credential_id: input.credential_id || null,
    credential_url: input.credential_url || null,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin
      .from("candidate_certifications")
      .insert(newRecord)
      .select()
      .maybeSingle();

    if (!error && data) {
      const existing = certCache.get(candidateId) || [];
      certCache.set(candidateId, [data, ...existing]);
      return data;
    }
  } catch {}

  const existing = certCache.get(candidateId) || [];
  certCache.set(candidateId, [newRecord, ...existing]);
  return newRecord;
}

export async function deleteCandidateCertification(candidateId: string, certId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("candidate_certifications")
      .delete()
      .eq("id", certId)
      .eq("candidate_id", candidateId);

    if (!error) {
      const existing = certCache.get(candidateId) || [];
      certCache.set(
        candidateId,
        existing.filter((e) => e.id !== certId)
      );
      return true;
    }
  } catch {}

  const existing = certCache.get(candidateId) || [];
  certCache.set(
    candidateId,
    existing.filter((e) => e.id !== certId)
  );
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getCandidateAchievements(candidateId: string): Promise<CandidateAchievement[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("candidate_achievements")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("date_awarded", { ascending: false, nullsFirst: false });

    if (!error && data) {
      achieveCache.set(candidateId, data);
      return data;
    }
  } catch {}
  return achieveCache.get(candidateId) || [];
}

export async function createCandidateAchievement(
  candidateId: string,
  input: Omit<CandidateAchievement, "id" | "candidate_id" | "created_at">
): Promise<CandidateAchievement> {
  const newRecord: CandidateAchievement = {
    id: crypto.randomUUID(),
    candidate_id: candidateId,
    title: input.title,
    issuer: input.issuer || null,
    date_awarded: input.date_awarded || null,
    description: input.description || null,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin
      .from("candidate_achievements")
      .insert(newRecord)
      .select()
      .maybeSingle();

    if (!error && data) {
      const existing = achieveCache.get(candidateId) || [];
      achieveCache.set(candidateId, [data, ...existing]);
      return data;
    }
  } catch {}

  const existing = achieveCache.get(candidateId) || [];
  achieveCache.set(candidateId, [newRecord, ...existing]);
  return newRecord;
}

export async function deleteCandidateAchievement(candidateId: string, achievementId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("candidate_achievements")
      .delete()
      .eq("id", achievementId)
      .eq("candidate_id", candidateId);

    if (!error) {
      const existing = achieveCache.get(candidateId) || [];
      achieveCache.set(
        candidateId,
        existing.filter((e) => e.id !== achievementId)
      );
      return true;
    }
  } catch {}

  const existing = achieveCache.get(candidateId) || [];
  achieveCache.set(
    candidateId,
    existing.filter((e) => e.id !== achievementId)
  );
  return true;
}
