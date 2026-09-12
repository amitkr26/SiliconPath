"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, X, Briefcase, GraduationCap, Code2, Award, Sparkles, Trash2, Check, Camera, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { RESERVED_USERNAMES } from "@/lib/utils";
import { api } from "@/lib/api-client";
import type {
  CandidateExperience,
  CandidateEducation,
  CandidateProject,
  CandidateCertification,
  CandidateAchievement,
} from "@/types";

export interface EditProfileData {
  display_name?: string;
  username?: string;
  headline?: string;
  bio?: string;
  job_title?: string;
  current_company?: string;
  location?: string;
  country?: string;
  website_url?: string;
  linkedin_url?: string;
  github_url?: string;
  is_open_to_work?: boolean;
  open_to_work_types?: string[];
  is_profile_public?: boolean;
  avatar_url?: string | null;
  skills?: string[];
}

interface Props {
  userId: string;
  profile: EditProfileData;
  initialExperiences?: CandidateExperience[];
  initialEducations?: CandidateEducation[];
  initialProjects?: CandidateProject[];
  initialCertifications?: CandidateCertification[];
  initialAchievements?: CandidateAchievement[];
  onClose: () => void;
  onSaved: (updated: EditProfileData) => void;
}

type TabType = "general" | "experience" | "education" | "projects" | "certifications" | "skills";

const PRESET_AVATARS = [
  { label: "RTL Verification", url: "https://api.dicebear.com/7.x/bottts/svg?seed=RTLVerification" },
  { label: "Physical Design", url: "https://api.dicebear.com/7.x/bottts/svg?seed=PhysicalDesign" },
  { label: "Silicon Architect", url: "https://api.dicebear.com/7.x/bottts/svg?seed=SiliconArchitect" },
  { label: "Embedded Firmware", url: "https://api.dicebear.com/7.x/bottts/svg?seed=EmbeddedFirmware" },
  { label: "Analog IC", url: "https://api.dicebear.com/7.x/bottts/svg?seed=AnalogDesign" },
  { label: "Microelectronics", url: "https://api.dicebear.com/7.x/bottts/svg?seed=MicroResearch" },
  { label: "Scholar Male", url: "https://api.dicebear.com/7.x/personas/svg?seed=AmitKumar" },
  { label: "Scholar Female", url: "https://api.dicebear.com/7.x/personas/svg?seed=PriyaSharma" },
];

export default function EditProfileModal({
  userId,
  profile,
  initialExperiences = [],
  initialEducations = [],
  initialProjects = [],
  initialCertifications = [],
  initialAchievements = [],
  onClose,
  onSaved,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [form, setForm] = useState<EditProfileData>(profile || {});
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("File size must be under 3MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.avatar_url) {
        setField("avatar_url", data.avatar_url);
        toast.success("Profile photo uploaded successfully!");
      } else {
        toast.error(data.error || "Failed to upload photo");
      }
    } catch {
      toast.error("Error uploading photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Sub-resource lists
  const [experiences, setExperiences] = useState<CandidateExperience[]>(initialExperiences);
  const [educations, setEducations] = useState<CandidateEducation[]>(initialEducations);
  const [projects, setProjects] = useState<CandidateProject[]>(initialProjects);
  const [certifications, setCertifications] = useState<CandidateCertification[]>(initialCertifications);
  const [achievements, setAchievements] = useState<CandidateAchievement[]>(initialAchievements);

  // Sub-resource add form states
  const [newExp, setNewExp] = useState({
    company_name: "",
    role_title: "",
    employment_type: "Full-time",
    location: "",
    start_date: "",
    end_date: "",
    is_current: false,
    description: "",
  });

  const [newEdu, setNewEdu] = useState({
    institution: "",
    degree: "",
    field_of_study: "",
    start_year: "",
    end_year: "",
    grade: "",
    description: "",
  });

  const [newProj, setNewProj] = useState({
    title: "",
    description: "",
    technologies: "",
    project_url: "",
    github_url: "",
  });

  const [newCert, setNewCert] = useState({
    name: "",
    issuing_org: "",
    issue_date: "",
    credential_id: "",
  });

  const [newAchieve, setNewAchieve] = useState({
    title: "",
    issuer: "",
    date_awarded: "",
  });

  const setField = (key: string, value: any) => setForm({ ...form, [key]: value });

  const handleUsernameChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setForm({ ...form, username: clean });
    if (clean && RESERVED_USERNAMES.includes(clean)) {
      setUsernameError("This username is reserved and cannot be used.");
    } else if (clean && (clean.length < 3 || clean.length > 40)) {
      setUsernameError("Username must be 3–40 characters.");
    } else {
      setUsernameError("");
    }
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setNewSkill("");
    }
  };

  const removeSkill = (s: string) => {
    setSkills(skills.filter((x) => x !== s));
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.company_name || !newExp.role_title || !newExp.start_date) {
      toast.error("Company, role title, and start date are required");
      return;
    }
    try {
      const res = await api.post<any>("/api/profile/me/experience", newExp);
      if (res?.experience) {
        setExperiences([res.experience, ...experiences]);
        setNewExp({
          company_name: "",
          role_title: "",
          employment_type: "Full-time",
          location: "",
          start_date: "",
          end_date: "",
          is_current: false,
          description: "",
        });
        toast.success("Experience added!");
      }
    } catch {
      toast.error("Failed to add experience");
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      await api.delete(`/api/profile/me/experience/${id}`);
      setExperiences(experiences.filter((x) => x.id !== id));
      toast.success("Experience removed");
    } catch {
      toast.error("Failed to remove experience");
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEdu.institution || !newEdu.degree) {
      toast.error("Institution and degree are required");
      return;
    }
    try {
      const res = await api.post<any>("/api/profile/me/education", newEdu);
      if (res?.education) {
        setEducations([res.education, ...educations]);
        setNewEdu({
          institution: "",
          degree: "",
          field_of_study: "",
          start_year: "",
          end_year: "",
          grade: "",
          description: "",
        });
        toast.success("Education added!");
      }
    } catch {
      toast.error("Failed to add education");
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      await api.delete(`/api/profile/me/education/${id}`);
      setEducations(educations.filter((x) => x.id !== id));
      toast.success("Education removed");
    } catch {
      toast.error("Failed to remove education");
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProj.title) {
      toast.error("Project title is required");
      return;
    }
    const techArray = newProj.technologies
      ? newProj.technologies.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    try {
      const res = await api.post<any>("/api/profile/me/projects", {
        ...newProj,
        technologies: techArray,
      });
      if (res?.project) {
        setProjects([res.project, ...projects]);
        setNewProj({
          title: "",
          description: "",
          technologies: "",
          project_url: "",
          github_url: "",
        });
        toast.success("Project added!");
      }
    } catch {
      toast.error("Failed to add project");
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await api.delete(`/api/profile/me/projects/${id}`);
      setProjects(projects.filter((x) => x.id !== id));
      toast.success("Project removed");
    } catch {
      toast.error("Failed to remove project");
    }
  };

  const handleAddCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCert.name || !newCert.issuing_org) {
      toast.error("Name and issuing organization are required");
      return;
    }
    try {
      const res = await api.post<any>("/api/profile/me/certifications", newCert);
      if (res?.certification) {
        setCertifications([res.certification, ...certifications]);
        setNewCert({ name: "", issuing_org: "", issue_date: "", credential_id: "" });
        toast.success("Certification added!");
      }
    } catch {
      toast.error("Failed to add certification");
    }
  };

  const handleDeleteCertification = async (id: string) => {
    try {
      await api.delete(`/api/profile/me/certifications/${id}`);
      setCertifications(certifications.filter((x) => x.id !== id));
      toast.success("Certification removed");
    } catch {
      toast.error("Failed to remove certification");
    }
  };

  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAchieve.title) {
      toast.error("Achievement title is required");
      return;
    }
    try {
      const res = await api.post<any>("/api/profile/me/achievements", newAchieve);
      if (res?.achievement) {
        setAchievements([res.achievement, ...achievements]);
        setNewAchieve({ title: "", issuer: "", date_awarded: "" });
        toast.success("Achievement added!");
      }
    } catch {
      toast.error("Failed to add achievement");
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    try {
      await api.delete(`/api/profile/me/achievements/${id}`);
      setAchievements(achievements.filter((x) => x.id !== id));
      toast.success("Achievement removed");
    } catch {
      toast.error("Failed to remove achievement");
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/profile/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: form.display_name,
          username: form.username,
          headline: form.headline,
          bio: form.bio,
          job_title: form.job_title,
          current_company: form.current_company,
          location: form.location,
          country: form.country,
          website_url: form.website_url,
          linkedin_url: form.linkedin_url,
          github_url: form.github_url,
          is_open_to_work: form.is_open_to_work,
          is_profile_public: form.is_profile_public,
          avatar_url: form.avatar_url,
          skills: skills,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error && data.error.includes("username")) {
          setUsernameError(data.error);
        }
        toast.error(data.error || "Failed to update profile.");
        return;
      }

      onSaved({ ...form, avatar_url: form.avatar_url, skills });
      toast.success("Profile updated successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-4 border-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-elevated space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Pencil className="w-5 h-5 text-blue-600" /> Edit Professional Profile
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700">
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 border-slate-900 transition-all ${
              activeTab === "general" ? "bg-blue-600 text-white shadow-brutal-sm" : "bg-slate-50 text-slate-700 hover:bg-white"
            }`}
          >
            General Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("experience")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 border-slate-900 transition-all ${
              activeTab === "experience" ? "bg-blue-600 text-white shadow-brutal-sm" : "bg-slate-50 text-slate-700 hover:bg-white"
            }`}
          >
            Experience ({experiences.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("education")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 border-slate-900 transition-all ${
              activeTab === "education" ? "bg-blue-600 text-white shadow-brutal-sm" : "bg-slate-50 text-slate-700 hover:bg-white"
            }`}
          >
            Education ({educations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 border-slate-900 transition-all ${
              activeTab === "projects" ? "bg-blue-600 text-white shadow-brutal-sm" : "bg-slate-50 text-slate-700 hover:bg-white"
            }`}
          >
            Projects ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("certifications")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 border-slate-900 transition-all ${
              activeTab === "certifications" ? "bg-blue-600 text-white shadow-brutal-sm" : "bg-slate-50 text-slate-700 hover:bg-white"
            }`}
          >
            Awards ({certifications.length + achievements.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("skills")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 border-slate-900 transition-all ${
              activeTab === "skills" ? "bg-blue-600 text-white shadow-brutal-sm" : "bg-slate-50 text-slate-700 hover:bg-white"
            }`}
          >
            Skills ({skills.length})
          </button>
        </div>

        {/* Tab 1: General Info */}
        {activeTab === "general" && (
          <form onSubmit={handleSaveGeneral} className="space-y-4">
            {/* PROFILE AVATAR / PHOTO SECTION */}
            <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 space-y-3">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                Profile Photo / Avatar
              </label>

              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full border-2 border-slate-900 overflow-hidden bg-white shrink-0 shadow-brutal-sm flex items-center justify-center">
                  {form.avatar_url ? (
                    <img
                      src={form.avatar_url}
                      alt="Profile Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-black text-lg">
                      {form.display_name?.slice(0, 2).toUpperCase() || "??"}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg border-2 border-slate-900 shadow-brutal-sm transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingAvatar ? "Uploading..." : "Upload Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="hidden"
                      />
                    </label>
                    {form.avatar_url && (
                      <button
                        type="button"
                        onClick={() => setField("avatar_url", null)}
                        className="px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Upload PNG, JPG, or WebP (max 3MB), or select a preset avatar below.
                  </p>
                </div>
              </div>

              {/* PRESET AVATARS */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Or choose a free semiconductor / scholar avatar:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setField("avatar_url", preset.url)}
                      title={preset.label}
                      className={`w-10 h-10 rounded-full border-2 overflow-hidden shrink-0 transition-all ${
                        form.avatar_url === preset.url
                          ? "border-blue-600 ring-2 ring-blue-600 scale-110 shadow-brutal-sm"
                          : "border-slate-900 hover:border-blue-600 bg-white"
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                Full Display Name *
              </label>
              <input
                type="text"
                value={form.display_name || ""}
                onChange={(e) => setField("display_name", e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-card focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                Unique Hardware Handle (@username) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">@</span>
                <input
                  type="text"
                  value={form.username || ""}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  required
                  className="w-full pl-8 pr-4 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-card focus:outline-none"
                />
              </div>
              {usernameError && <p className="text-[11px] font-bold text-red-600 mt-1">{usernameError}</p>}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                Professional Headline
              </label>
              <input
                type="text"
                value={form.headline || ""}
                onChange={(e) => setField("headline", e.target.value)}
                placeholder="e.g. M.Tech VLSI @ IIT Bombay | RISC-V & ASIC Design Lead"
                className="w-full px-4 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-card focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                  Current Job Title
                </label>
                <input
                  type="text"
                  value={form.job_title || ""}
                  onChange={(e) => setField("job_title", e.target.value)}
                  placeholder="e.g. Physical Design Engineer"
                  className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                  Current Organization / Company
                </label>
                <input
                  type="text"
                  value={form.current_company || ""}
                  onChange={(e) => setField("current_company", e.target.value)}
                  placeholder="e.g. Synopsys / DRDO"
                  className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                Location
              </label>
              <input
                type="text"
                value={form.location || ""}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="e.g. Bengaluru, Karnataka, India"
                className="w-full px-4 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-card focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                About / Summary
              </label>
              <textarea
                rows={3}
                value={form.bio || ""}
                onChange={(e) => setField("bio", e.target.value)}
                placeholder="Write a brief overview of your background, research interests, & hardware skills..."
                className="w-full px-4 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-card focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_open_to_work"
                checked={!!form.is_open_to_work}
                onChange={(e) => setField("is_open_to_work", e.target.checked)}
                className="w-4 h-4 rounded border-2 border-slate-900 text-blue-600 focus:ring-0"
              />
              <label htmlFor="is_open_to_work" className="text-xs font-bold text-slate-900">
                Open to work / hiring opportunities
              </label>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_profile_public"
                checked={form.is_profile_public !== false}
                onChange={(e) => setField("is_profile_public", e.target.checked)}
                className="w-4 h-4 rounded border-2 border-slate-900 text-blue-600 focus:ring-0"
              />
              <label htmlFor="is_profile_public" className="text-xs font-bold text-slate-900">
                Public profile (visible in search and recommendations)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={form.linkedin_url || ""}
                  onChange={(e) => setField("linkedin_url", e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={form.github_url || ""}
                  onChange={(e) => setField("github_url", e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t-2 border-slate-900">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 rounded-xl text-xs font-black text-slate-900 shadow-card-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white border-2 border-slate-900 rounded-xl text-xs font-black shadow-card flex items-center gap-2 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Experience */}
        {activeTab === "experience" && (
          <div className="space-y-5">
            {/* List existing */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase">Existing Experiences</h3>
              {experiences.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium">No experience items recorded.</p>
              ) : (
                experiences.map((exp) => (
                  <div key={exp.id} className="p-3 bg-slate-50 border-2 border-slate-900 rounded-xl flex items-start justify-between gap-3 shadow-brutal-sm">
                    <div>
                      <p className="text-xs font-black text-slate-900">{exp.role_title} @ {exp.company_name}</p>
                      <p className="text-[11px] font-semibold text-slate-600">
                        {exp.start_date} – {exp.is_current ? "Present" : exp.end_date || "Present"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteExperience(exp.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add New Form */}
            <form onSubmit={handleAddExperience} className="border-t-2 border-slate-200 pt-4 space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" /> Add Work or Research Experience
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Organization / Company *"
                  value={newExp.company_name}
                  onChange={(e) => setNewExp({ ...newExp, company_name: e.target.value })}
                  required
                  className="px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Role Title *"
                  value={newExp.role_title}
                  onChange={(e) => setNewExp({ ...newExp, role_title: e.target.value })}
                  required
                  className="px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  placeholder="Start Date *"
                  value={newExp.start_date}
                  onChange={(e) => setNewExp({ ...newExp, start_date: e.target.value })}
                  required
                  className="px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900"
                />
                <input
                  type="date"
                  placeholder="End Date"
                  value={newExp.end_date}
                  onChange={(e) => setNewExp({ ...newExp, end_date: e.target.value })}
                  disabled={newExp.is_current}
                  className="px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 disabled:opacity-50"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="exp_current"
                  checked={newExp.is_current}
                  onChange={(e) => setNewExp({ ...newExp, is_current: e.target.checked, end_date: "" })}
                  className="w-4 h-4 rounded border-2 border-slate-900 text-blue-600"
                />
                <label htmlFor="exp_current" className="text-xs font-bold text-slate-900">
                  I currently work here
                </label>
              </div>
              <textarea
                rows={2}
                placeholder="Key contributions & responsibilities..."
                value={newExp.description}
                onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 resize-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white font-black text-xs border-2 border-slate-900 rounded-xl shadow-card-sm"
              >
                + Add Experience
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Education */}
        {activeTab === "education" && (
          <div className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase">Existing Education</h3>
              {educations.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium">No education items recorded.</p>
              ) : (
                educations.map((edu) => (
                  <div key={edu.id} className="p-3 bg-slate-50 border-2 border-slate-900 rounded-xl flex items-start justify-between gap-3 shadow-brutal-sm">
                    <div>
                      <p className="text-xs font-black text-slate-900">{edu.institution}</p>
                      <p className="text-[11px] font-semibold text-slate-600">{edu.degree} {edu.field_of_study && `(${edu.field_of_study})`}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteEducation(edu.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddEducation} className="border-t-2 border-slate-200 pt-4 space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" /> Add Education
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Institution / University *"
                  value={newEdu.institution}
                  onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                  required
                  className="px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Degree (e.g. B.Tech, M.Tech, PhD) *"
                  value={newEdu.degree}
                  onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                  required
                  className="px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Field of Study"
                  value={newEdu.field_of_study}
                  onChange={(e) => setNewEdu({ ...newEdu, field_of_study: e.target.value })}
                  className="px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900"
                />
                <input
                  type="number"
                  placeholder="Start Year"
                  value={newEdu.start_year}
                  onChange={(e) => setNewEdu({ ...newEdu, start_year: e.target.value })}
                  className="px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900"
                />
                <input
                  type="number"
                  placeholder="End Year"
                  value={newEdu.end_year}
                  onChange={(e) => setNewEdu({ ...newEdu, end_year: e.target.value })}
                  className="px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white font-black text-xs border-2 border-slate-900 rounded-xl shadow-card-sm"
              >
                + Add Education
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Projects */}
        {activeTab === "projects" && (
          <div className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase">Existing Projects</h3>
              {projects.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium">No projects added yet.</p>
              ) : (
                projects.map((proj) => (
                  <div key={proj.id} className="p-3 bg-slate-50 border-2 border-slate-900 rounded-xl flex items-start justify-between gap-3 shadow-brutal-sm">
                    <div>
                      <p className="text-xs font-black text-slate-900">{proj.title}</p>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <p className="text-[11px] font-semibold text-slate-500">{proj.technologies.join(", ")}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddProject} className="border-t-2 border-slate-200 pt-4 space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" /> Add Technical Project
              </h3>
              <input
                type="text"
                placeholder="Project Title *"
                value={newProj.title}
                onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
                required
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900"
              />
              <textarea
                rows={2}
                placeholder="Description & architectural highlights..."
                value={newProj.description}
                onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 resize-none"
              />
              <input
                type="text"
                placeholder="Technologies (comma separated, e.g. SystemVerilog, UVM, Cocotb)"
                value={newProj.technologies}
                onChange={(e) => setNewProj({ ...newProj, technologies: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="url"
                  placeholder="GitHub Repository URL"
                  value={newProj.github_url}
                  onChange={(e) => setNewProj({ ...newProj, github_url: e.target.value })}
                  className="px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900"
                />
                <input
                  type="url"
                  placeholder="Live Demo / Publication URL"
                  value={newProj.project_url}
                  onChange={(e) => setNewProj({ ...newProj, project_url: e.target.value })}
                  className="px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white font-black text-xs border-2 border-slate-900 rounded-xl shadow-card-sm"
              >
                + Add Project
              </button>
            </form>
          </div>
        )}

        {/* Tab 5: Certifications & Achievements */}
        {activeTab === "certifications" && (
          <div className="space-y-5">
            {/* Certifications list */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase">Certifications ({certifications.length})</h3>
              {certifications.map((c) => (
                <div key={c.id} className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-900">{c.name}</p>
                    <p className="text-[10px] text-slate-600">{c.issuing_org}</p>
                  </div>
                  <button type="button" onClick={() => handleDeleteCertification(c.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <form onSubmit={handleAddCertification} className="pt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Cert Name *"
                  value={newCert.name}
                  onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                  required
                  className="flex-1 px-3 py-1.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="Issuing Org *"
                  value={newCert.issuing_org}
                  onChange={(e) => setNewCert({ ...newCert, issuing_org: e.target.value })}
                  required
                  className="flex-1 px-3 py-1.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold"
                />
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl border-2 border-slate-900">
                  + Add
                </button>
              </form>
            </div>

            {/* Achievements list */}
            <div className="space-y-3 border-t-2 border-slate-200 pt-4">
              <h3 className="text-xs font-black text-slate-900 uppercase">Honors &amp; Awards ({achievements.length})</h3>
              {achievements.map((a) => (
                <div key={a.id} className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-900">{a.title}</p>
                    <p className="text-[10px] text-slate-600">{a.issuer}</p>
                  </div>
                  <button type="button" onClick={() => handleDeleteAchievement(a.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <form onSubmit={handleAddAchievement} className="pt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Award Title *"
                  value={newAchieve.title}
                  onChange={(e) => setNewAchieve({ ...newAchieve, title: e.target.value })}
                  required
                  className="flex-1 px-3 py-1.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="Issuer"
                  value={newAchieve.issuer}
                  onChange={(e) => setNewAchieve({ ...newAchieve, issuer: e.target.value })}
                  className="flex-1 px-3 py-1.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold"
                />
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl border-2 border-slate-900">
                  + Add
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 6: Skills */}
        {activeTab === "skills" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                Core Engineering Skills
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.length === 0 && (
                  <span className="text-xs font-bold text-slate-400">No skills added yet.</span>
                )}
                {skills.map((sk) => (
                  <span
                    key={sk}
                    className="px-3 py-1.5 bg-slate-100 border-2 border-slate-900 rounded-xl text-xs font-black text-slate-900 shadow-card-sm flex items-center gap-2"
                  >
                    {sk}
                    <button type="button" onClick={() => removeSkill(sk)} className="hover:text-red-600 transition">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="Add skill (e.g. RTL, Verilog, UVM, FPGA, STA)..."
                  className="flex-1 px-4 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-card-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs border-2 border-slate-900 rounded-xl shadow-card-sm flex items-center gap-1 transition"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
