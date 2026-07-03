"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, Check, ChevronLeft, ChevronRight, Plus, X, Save,
  FileText, User, GraduationCap, Wrench, Briefcase, FolderGit2, BookOpen,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { num: 1, label: "Personal", icon: User },
  { num: 2, label: "Education", icon: GraduationCap },
  { num: 3, label: "Skills", icon: Wrench },
  { num: 4, label: "Experience", icon: Briefcase },
  { num: 5, label: "Projects", icon: FolderGit2 },
  { num: 6, label: "Publications", icon: BookOpen },
];

const SKILL_SUGGESTIONS = [
  "Verilog", "SystemVerilog", "Cadence Virtuoso", "MATLAB", "Python",
  "RTL Design", "FPGA", "Embedded C", "VLSI", "CMOS", "KiCad", "Altium",
  "HSPICE", "ADS", "LabVIEW", "Microcontroller", "Arduino", "Raspberry Pi",
  "thin film", "sputtering",
];

interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  year: string;
  cgpa: string;
}

interface ExperienceEntry {
  company: string;
  role: string;
  duration: string;
  description: string;
}

interface ProjectEntry {
  name: string;
  description: string;
  technologies: string;
  link: string;
}

interface PublicationEntry {
  title: string;
  venue: string;
  year: string;
  doi: string;
}

export default function ResumePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [atsFeedback, setAtsFeedback] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");

  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [publications, setPublications] = useState<PublicationEntry[]>([]);

  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
      // Pre-fill from user_profiles
      supabase.from("user_profiles").select("full_name").eq("id", data.user.id).maybeSingle().then(({ data: profile }) => {
        if (profile?.full_name) setFullName(profile.full_name);
      });
      // Load existing resume
      fetch("/api/resume").then(r => r.json()).then((data) => {
        if (data && data.full_name) {
          setFullName(data.full_name || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          setLinkedin(data.linkedin || "");
          setGithub(data.github || "");
          setEducation(data.education || []);
          setSkills(data.skills || []);
          setExperience(data.experience || []);
          setProjects(data.projects || []);
          setPublications(data.publications || []);
          if (data.ats_score > 0) setAtsScore(data.ats_score);
          if (data.ats_feedback?.length) setAtsFeedback(data.ats_feedback);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, [router]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
    }
    setSkillInput("");
    setShowSuggestions(false);
  };

  const removeSkill = (s: string) => setSkills(skills.filter(x => x !== s));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          linkedin,
          github,
          education,
          skills,
          experience,
          projects,
          publications,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAtsScore(data.ats_score);
        setAtsFeedback(data.ats_feedback);
        setSaved(true);
        toast.success(`Resume saved! ATS Score: ${data.ats_score}/100`);
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setSaving(false);
  };

  const getResumePreview = () => {
    const eduLines = education.map(e => `${e.degree} in ${e.field} — ${e.institution} (${e.year})`);
    const expLines = experience.map(e => `${e.role} at ${e.company} (${e.duration})`);
    const projLines = projects.map(p => p.name);

    return { eduLines, expLines, projLines };
  };

  const preview = getResumePreview();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">AI Resume Builder</h1>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div key={s.num} className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setStep(s.num)}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-accent text-bg-primary"
                    : isDone
                    ? "bg-success/20 text-success"
                    : "bg-surface text-text-muted border border-border"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-4 sm:w-8 h-0.5 ${step > s.num ? "bg-success" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Form */}
        <div className="flex-1 bg-surface border border-border rounded-xl p-4 sm:p-6">
          {/* Step 1: Personal */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-text-primary">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-xs font-medium mb-1">Full Name</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-surface-elevated border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-accent focus:border-accent outline-none" />
                </div>
                <div>
                  <label className="block text-text-secondary text-xs font-medium mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-surface-elevated border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-accent focus:border-accent outline-none" />
                </div>
                <div>
                  <label className="block text-text-secondary text-xs font-medium mb-1">Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-surface-elevated border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-accent focus:border-accent outline-none" />
                </div>
                <div>
                  <label className="block text-text-secondary text-xs font-medium mb-1">LinkedIn</label>
                  <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full bg-surface-elevated border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-accent focus:border-accent outline-none" />
                </div>
                <div>
                  <label className="block text-text-secondary text-xs font-medium mb-1">GitHub</label>
                  <input value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/..." className="w-full bg-surface-elevated border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-accent focus:border-accent outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Education */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-text-primary">Education</h2>
              {education.map((edu, i) => (
                <div key={i} className="bg-surface-elevated border border-border rounded-lg p-4 space-y-3 relative">
                  <button onClick={() => setEducation(education.filter((_, j) => j !== i))} className="absolute top-3 right-3 text-danger hover:text-danger/80">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input value={edu.institution} onChange={e => { const n = [...education]; n[i] = { ...n[i], institution: e.target.value }; setEducation(n); }} placeholder="Institution" className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none" />
                    <input value={edu.degree} onChange={e => { const n = [...education]; n[i] = { ...n[i], degree: e.target.value }; setEducation(n); }} placeholder="Degree (B.Tech, M.Sc, PhD)" className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none" />
                    <input value={edu.field} onChange={e => { const n = [...education]; n[i] = { ...n[i], field: e.target.value }; setEducation(n); }} placeholder="Field of Study" className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none" />
                    <input value={edu.year} onChange={e => { const n = [...education]; n[i] = { ...n[i], year: e.target.value }; setEducation(n); }} placeholder="Year" className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none" />
                    <input value={edu.cgpa} onChange={e => { const n = [...education]; n[i] = { ...n[i], cgpa: e.target.value }; setEducation(n); }} placeholder="CGPA/Percentage" className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none" />
                  </div>
                </div>
              ))}
              <button onClick={() => setEducation([...education, { institution: "", degree: "", field: "", year: "", cgpa: "" }])} className="flex items-center gap-2 text-accent text-sm font-medium hover:text-accent-hover">
                <Plus className="w-4 h-4" /> Add Education
              </button>
            </div>
          )}

          {/* Step 3: Skills */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-text-primary">Skills</h2>
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    value={skillInput}
                    onChange={e => { setSkillInput(e.target.value); setShowSuggestions(true); }}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    placeholder="Type a skill and press Enter"
                    className="flex-1 bg-surface-elevated border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-accent focus:border-accent outline-none"
                  />
                  <button onClick={addSkill} className="bg-accent text-bg-primary rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent-hover">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {showSuggestions && skillInput && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-surface border border-border rounded-lg shadow-card-dark z-10 max-h-40 overflow-y-auto">
                    {SKILL_SUGGESTIONS.filter(s => s.toLowerCase().includes(skillInput.toLowerCase()) && !skills.includes(s)).map(s => (
                      <button key={s} onClick={() => { setSkills([...skills, s]); setSkillInput(""); setShowSuggestions(false); }} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-accent/10 hover:text-accent transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent border border-accent/30 rounded-full text-sm">
                    {s}
                    <button onClick={() => removeSkill(s)} className="hover:text-accent-hover"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              {skills.length === 0 && <p className="text-text-muted text-sm">No skills added yet. Type above or select from suggestions.</p>}
            </div>
          )}

          {/* Step 4: Experience */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-text-primary">Experience <span className="text-text-muted text-sm font-normal">(optional)</span></h2>
              {experience.map((exp, i) => (
                <div key={i} className="bg-surface-elevated border border-border rounded-lg p-4 space-y-3 relative">
                  <button onClick={() => setExperience(experience.filter((_, j) => j !== i))} className="absolute top-3 right-3 text-danger hover:text-danger/80">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input value={exp.company} onChange={e => { const n = [...experience]; n[i] = { ...n[i], company: e.target.value }; setExperience(n); }} placeholder="Company / Lab" className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none" />
                    <input value={exp.role} onChange={e => { const n = [...experience]; n[i] = { ...n[i], role: e.target.value }; setExperience(n); }} placeholder="Role" className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none" />
                    <input value={exp.duration} onChange={e => { const n = [...experience]; n[i] = { ...n[i], duration: e.target.value }; setExperience(n); }} placeholder="Duration (e.g. Jun 2024 - Dec 2024)" className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none" />
                  </div>
                  <textarea value={exp.description} onChange={e => { const n = [...experience]; n[i] = { ...n[i], description: e.target.value }; setExperience(n); }} placeholder="Description of responsibilities and achievements" rows={2} className="w-full bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none" />
                </div>
              ))}
              <button onClick={() => setExperience([...experience, { company: "", role: "", duration: "", description: "" }])} className="flex items-center gap-2 text-accent text-sm font-medium hover:text-accent-hover">
                <Plus className="w-4 h-4" /> Add Experience
              </button>
            </div>
          )}

          {/* Step 5: Projects */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-text-primary">Projects</h2>
              {projects.map((proj, i) => (
                <div key={i} className="bg-surface-elevated border border-border rounded-lg p-4 space-y-3 relative">
                  <button onClick={() => setProjects(projects.filter((_, j) => j !== i))} className="absolute top-3 right-3 text-danger hover:text-danger/80">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input value={proj.name} onChange={e => { const n = [...projects]; n[i] = { ...n[i], name: e.target.value }; setProjects(n); }} placeholder="Project Name" className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none" />
                    <input value={proj.technologies} onChange={e => { const n = [...projects]; n[i] = { ...n[i], technologies: e.target.value }; setProjects(n); }} placeholder="Technologies Used" className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none" />
                    <input value={proj.link} onChange={e => { const n = [...projects]; n[i] = { ...n[i], link: e.target.value }; setProjects(n); }} placeholder="Link (optional)" className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none sm:col-span-2" />
                  </div>
                  <textarea value={proj.description} onChange={e => { const n = [...projects]; n[i] = { ...n[i], description: e.target.value }; setProjects(n); }} placeholder="Description" rows={2} className="w-full bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none" />
                </div>
              ))}
              <button onClick={() => setProjects([...projects, { name: "", description: "", technologies: "", link: "" }])} className="flex items-center gap-2 text-accent text-sm font-medium hover:text-accent-hover">
                <Plus className="w-4 h-4" /> Add Project
              </button>
            </div>
          )}

          {/* Step 6: Publications */}
          {step === 6 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-text-primary">Publications <span className="text-text-muted text-sm font-normal">(optional)</span></h2>
              {publications.map((pub, i) => (
                <div key={i} className="bg-surface-elevated border border-border rounded-lg p-4 space-y-3 relative">
                  <button onClick={() => setPublications(publications.filter((_, j) => j !== i))} className="absolute top-3 right-3 text-danger hover:text-danger/80">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input value={pub.title} onChange={e => { const n = [...publications]; n[i] = { ...n[i], title: e.target.value }; setPublications(n); }} placeholder="Title" className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none sm:col-span-2" />
                    <input value={pub.venue} onChange={e => { const n = [...publications]; n[i] = { ...n[i], venue: e.target.value }; setPublications(n); }} placeholder="Journal / Conference" className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none" />
                    <input value={pub.year} onChange={e => { const n = [...publications]; n[i] = { ...n[i], year: e.target.value }; setPublications(n); }} placeholder="Year" className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none" />
                    <input value={pub.doi} onChange={e => { const n = [...publications]; n[i] = { ...n[i], doi: e.target.value }; setPublications(n); }} placeholder="DOI / Link (optional)" className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none sm:col-span-2" />
                  </div>
                </div>
              ))}
              <button onClick={() => setPublications([...publications, { title: "", venue: "", year: "", doi: "" }])} className="flex items-center gap-2 text-accent text-sm font-medium hover:text-accent-hover">
                <Plus className="w-4 h-4" /> Add Publication
              </button>

              {/* ATS Feedback */}
              {atsFeedback.length > 0 && (
                <div className="bg-surface-elevated border border-accent/30 rounded-lg p-4 mt-4">
                  <h3 className="font-display text-sm font-bold text-accent mb-2">AI Improvement Suggestions</h3>
                  <ul className="space-y-1">
                    {atsFeedback.map((f, i) => (
                      <li key={i} className="text-text-secondary text-sm flex items-start gap-2">
                        <span className="text-accent mt-0.5">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            {step < 6 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1 bg-accent text-bg-primary rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent-hover"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-accent text-bg-primary rounded-lg px-6 py-2 text-sm font-medium hover:bg-accent-hover disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save & Score
              </button>
            )}
          </div>
        </div>

        {/* Right Sidebar — Live ATS Preview */}
        <div className="lg:w-[35%]">
          <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 sticky top-24">
            <h3 className="font-display text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              LIVE ATS PREVIEW
            </h3>
            {fullName || email || skills.length > 0 || education.length > 0 ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-bold text-text-primary text-base">{fullName || "Your Name"}</p>
                  <p className="text-text-muted text-xs truncate">
                    {[email, phone, linkedin, github].filter(Boolean).join(" · ") || "email · phone · linkedin"}
                  </p>
                </div>
                <hr className="border-border" />
                {education.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">EDUCATION</p>
                    {preview.eduLines.map((line, i) => (
                      <p key={i} className="text-text-secondary text-xs mb-0.5">{line}</p>
                    ))}
                  </div>
                )}
                {skills.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">SKILLS</p>
                    <p className="text-text-secondary text-xs">{skills.join(", ")}</p>
                  </div>
                )}
                {preview.expLines.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">EXPERIENCE</p>
                    {preview.expLines.map((line, i) => (
                      <p key={i} className="text-text-secondary text-xs mb-0.5">{line}</p>
                    ))}
                  </div>
                )}
                {preview.projLines.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">PROJECTS</p>
                    {preview.projLines.map((line, i) => (
                      <p key={i} className="text-text-secondary text-xs mb-0.5">{line}</p>
                    ))}
                  </div>
                )}
                <hr className="border-border" />
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-xs">ATS Score</span>
                  <span className={`font-bold text-lg ${atsScore !== null ? (atsScore >= 70 ? "text-success" : atsScore >= 40 ? "text-warning" : "text-danger") : "text-text-muted"}`}>
                    {atsScore !== null ? `${atsScore}/100` : "—"}
                  </span>
                </div>
                {atsFeedback.length > 0 && (
                  <p className="text-text-muted text-xs">{atsFeedback.length} improvement{atsFeedback.length > 1 ? "s" : ""} suggested</p>
                )}
              </div>
            ) : (
              <p className="text-text-muted text-sm text-center py-8">Fill in your details to see a live preview</p>
            )}
            {saved && (
              <button
                onClick={() => window.print()}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-accent/20 text-accent border border-accent/30 rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent/30 transition-colors"
              >
                <FileText className="w-4 h-4" /> Download PDF
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="resume-print-area hidden">
        <div className="max-w-[210mm] mx-auto bg-white text-black p-8">
          <h1 className="text-2xl font-bold">{fullName || "Your Name"}</h1>
          <p className="text-sm text-gray-600">{email}{phone ? ` | ${phone}` : ""}</p>
          <hr className="my-4 border-gray-300" />
          {education.length > 0 && (
            <div className="mb-4">
              <h2 className="text-lg font-bold mb-2">Education</h2>
              {education.map((e, i) => (
                <p key={i} className="text-sm">{e.degree} in {e.field} — {e.institution} ({e.year}){e.cgpa ? ` — ${e.cgpa}` : ""}</p>
              ))}
            </div>
          )}
          {skills.length > 0 && (
            <div className="mb-4">
              <h2 className="text-lg font-bold mb-2">Skills</h2>
              <p className="text-sm">{skills.join(", ")}</p>
            </div>
          )}
          {experience.length > 0 && (
            <div className="mb-4">
              <h2 className="text-lg font-bold mb-2">Experience</h2>
              {experience.map((e, i) => (
                <div key={i} className="mb-2">
                  <p className="font-semibold text-sm">{e.role} — {e.company}</p>
                  <p className="text-xs text-gray-500">{e.duration}</p>
                  <p className="text-sm mt-1">{e.description}</p>
                </div>
              ))}
            </div>
          )}
          {projects.length > 0 && (
            <div className="mb-4">
              <h2 className="text-lg font-bold mb-2">Projects</h2>
              {projects.map((p, i) => (
                <div key={i} className="mb-2">
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.technologies}</p>
                  <p className="text-sm mt-1">{p.description}</p>
                </div>
              ))}
            </div>
          )}
          {publications.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-2">Publications</h2>
              {publications.map((p, i) => (
                <p key={i} className="text-sm mb-1">&ldquo;{p.title}&rdquo; &mdash; {p.venue} ({p.year})</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
