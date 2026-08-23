import { ProfileCompleteness, UserProfile, CandidateExperience, CandidateEducation, CandidateProject } from "@/types";

export function calculateProfileCompleteness(params: {
  profile: Partial<UserProfile> | null | undefined;
  experiences?: CandidateExperience[];
  educations?: CandidateEducation[];
  projects?: CandidateProject[];
}): ProfileCompleteness {
  const { profile, experiences = [], educations = [], projects = [] } = params;

  if (!profile) {
    return {
      score: 0,
      percentage: 0,
      breakdown: {
        identity: false,
        avatar: false,
        bio: false,
        location: false,
        skills: false,
        experience: false,
        education: false,
        projects: false,
        careerPreferences: false,
      },
      missingItems: [
        "Add your full name, username, and professional headline",
        "Upload a profile photo",
        "Add a summary bio",
        "Add your location",
        "Add at least 3 core technical skills",
        "Add work or research experience",
        "Add your education details",
        "Add projects or portfolio link",
        "Set your Open-to-Work career preferences",
      ],
    };
  }

  const hasIdentity = Boolean(
    profile.display_name?.trim() &&
    profile.username?.trim()
  );

  const hasAvatar = Boolean(
    profile.avatar_url &&
    profile.avatar_url.trim().length > 5
  );

  const hasBio = Boolean(
    (profile.bio || profile.about)?.trim() &&
    ((profile.bio || profile.about)?.trim().length || 0) >= 10
  );

  const hasLocation = Boolean(
    profile.location?.trim() || profile.city?.trim()
  );

  const hasSkills = Boolean(
    Array.isArray(profile.skills) && profile.skills.length >= 3
  );

  const hasExperience = Boolean(
    experiences.length > 0 ||
    (profile.job_title?.trim() && profile.current_company?.trim())
  );

  const hasEducation = Boolean(
    educations.length > 0 ||
    profile.qualification?.trim()
  );

  const hasProjects = Boolean(
    projects.length > 0 ||
    profile.github_url?.trim() ||
    profile.website_url?.trim()
  );

  const hasCareerPreferences = Boolean(
    typeof profile.is_open_to_work === "boolean" ||
    (profile.open_to_work_types && profile.open_to_work_types.length > 0)
  );

  let score = 0;
  if (hasIdentity) score += 15;
  if (hasAvatar) score += 10;
  if (hasBio) score += 10;
  if (hasLocation) score += 5;
  if (hasSkills) score += 15;
  if (hasExperience) score += 15;
  if (hasEducation) score += 15;
  if (hasProjects) score += 10;
  if (hasCareerPreferences) score += 5;

  const missingItems: string[] = [];
  if (!hasIdentity) missingItems.push("Add your full name, username, and professional headline");
  if (!hasAvatar) missingItems.push("Upload a profile photo");
  if (!hasBio) missingItems.push("Add a summary bio (at least 30 characters)");
  if (!hasLocation) missingItems.push("Add your location");
  if (!hasSkills) missingItems.push("Add at least 3 core technical skills");
  if (!hasExperience) missingItems.push("Add work or research experience");
  if (!hasEducation) missingItems.push("Add your education details");
  if (!hasProjects) missingItems.push("Add projects or portfolio link");
  if (!hasCareerPreferences) missingItems.push("Set your Open-to-Work career preferences");

  return {
    score,
    percentage: Math.min(100, Math.max(0, score)),
    breakdown: {
      identity: hasIdentity,
      avatar: hasAvatar,
      bio: hasBio,
      location: hasLocation,
      skills: hasSkills,
      experience: hasExperience,
      education: hasEducation,
      projects: hasProjects,
      careerPreferences: hasCareerPreferences,
    },
    missingItems,
  };
}
