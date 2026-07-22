"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Save, Plus, Trash2, Layout, User,
  Briefcase, GraduationCap, Code, FolderGit2, Download, Sparkles
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface EduItem { school: string; degree: string; year: string }
interface ExpItem { role: string; org: string; period: string; detail: string }
interface ProjItem { name: string; detail: string }

export default function ResumeBuilderPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "education" | "experience" | "skills" | "projects">("personal");
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  // Resume State
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");
  const [education, setEducation] = useState<EduItem[]>([]);
  const [experience, setExperience] = useState<ExpItem[]>([]);
  const [projects, setProjects] = useState<ProjItem[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Styling Customizer
  const [accentColor, setAccentColor] = useState("#00E5FF");
  const [fontFamily, setFontFamily] = useState("font-sans");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirectTo=/resume");
      return;
    }
    api.get<{
      full_name?: string;
      headline?: string;
      email?: string;
      phone?: string;
      location?: string;
      summary?: string;
      education?: EduItem[];
      experience?: ExpItem[];
      projects?: ProjItem[];
      skills?: string[];
      ats_score?: number;
      ats_feedback?: string[];
    }>("/api/resume")
      .then((r) => {
        setFullName(r.full_name || "");
        setHeadline(r.headline || "");
        setEmail(r.email || "");
        setPhone(r.phone || "");
        setLocation(r.location || "");
        setSummary(r.summary || "");
        setEducation(r.education || []);
        setExperience(r.experience || []);
        setProjects(r.projects || []);
        setSkills(r.skills || []);
        setAtsScore(typeof r.ats_score === "number" ? r.ats_score : null);
        setFeedback(r.ats_feedback || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const save = async () => {
    setSaving(true);
    try {
      const data = await api.post<{ ats_score?: number; ats_feedback?: string[]; error?: string }>("/api/resume", {
        full_name: fullName,
        headline,
        email,
        phone,
        location,
        summary,
        education,
        experience,
        projects,
        skills,
      });
      if (data.ats_score !== undefined) {
        setAtsScore(data.ats_score);
        setFeedback(data.ats_feedback || []);
        toast.success(`Saved successfully! ATS Match Score: ${data.ats_score}/100`);
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const inputCls =
    "w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none focus:border-accent transition-colors placeholder:text-text-muted";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-bg-primary py-8 print:p-0 print:bg-white print:min-h-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:p-0">
        
        {/* Header Control Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 print:hidden">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-3">
              <Layout className="w-8 h-8 text-accent" />
              Berojgar Resume Builder
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Create a custom single-page profile resume tailored for VLSI, semiconductor, and hardware jobs.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 border border-border bg-surface text-text-secondary hover:text-text-primary px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <Download className="w-4 h-4" /> Print / PDF
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-accent text-bg-primary hover:bg-accent-hover px-4 py-2.5 rounded-lg text-sm font-semibold shadow-glow-btn transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save & Analyze"}
            </button>
          </div>
        </div>

        {/* Builder Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start print:block">
          
          {/* Left Editor Console */}
          <div className="space-y-6 print:hidden">
            {/* Editor Tabs Navigation */}
            <div className="flex bg-surface border border-border p-1.5 rounded-xl gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
              <button
                onClick={() => setActiveTab("personal")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "personal" ? "bg-accent text-bg-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <User className="w-3.5 h-3.5" /> Personal
              </button>
              <button
                onClick={() => setActiveTab("education")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "education" ? "bg-accent text-bg-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Education
              </button>
              <button
                onClick={() => setActiveTab("experience")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "experience" ? "bg-accent text-bg-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" /> Experience
              </button>
              <button
                onClick={() => setActiveTab("skills")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "skills" ? "bg-accent text-bg-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Code className="w-3.5 h-3.5" /> Skills
              </button>
              <button
                onClick={() => setActiveTab("projects")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "projects" ? "bg-accent text-bg-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" /> Projects
              </button>
            </div>

            {/* Design & Styles Tool Box */}
            <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-display font-bold text-text-primary text-sm">Resume Customization</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Accent Color</label>
                  <div className="flex gap-2.5">
                    {["#00E5FF", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"].map((color) => (
                      <button
                        key={color}
                        onClick={() => setAccentColor(color)}
                        className={`w-6 h-6 rounded-full border transition-transform ${
                          accentColor === color ? "scale-125 border-text-primary" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Font Style</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="bg-bg-primary border border-border text-text-primary text-xs rounded-lg px-2 py-1.5 outline-none"
                  >
                    <option value="font-sans">Modern Sans</option>
                    <option value="font-serif">Classic Serif</option>
                    <option value="font-mono">Technical Mono</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Section Form Fields */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
              {activeTab === "personal" && (
                <div className="space-y-4">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className={inputCls}
                  />
                  <input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Professional Headline (e.g. ASIC Design Engineer)"
                    className={inputCls}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className={inputCls}
                    />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone Number"
                      className={inputCls}
                    />
                  </div>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location (e.g. Bengaluru, India)"
                    className={inputCls}
                  />
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Professional Summary / Profile statement..."
                    rows={4}
                    className={`${inputCls} resize-none`}
                  />
                </div>
              )}

              {activeTab === "education" && (
                <div className="space-y-4">
                  {education.map((ed, i) => (
                    <div key={i} className="space-y-3 border border-border rounded-lg p-4 bg-bg-primary/30 relative">
                      <button
                        onClick={() => setEducation(education.filter((_, j) => j !== i))}
                        className="absolute top-3 right-3 text-text-muted hover:text-danger transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <input
                        value={ed.school}
                        onChange={(e) =>
                          setEducation(
                            education.map((x, j) => (j === i ? { ...x, school: e.target.value } : x))
                          )
                        }
                        placeholder="School / University"
                        className={inputCls}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={ed.degree}
                          onChange={(e) =>
                            setEducation(
                              education.map((x, j) => (j === i ? { ...x, degree: e.target.value } : x))
                            )
                          }
                          placeholder="Degree / Course"
                          className={inputCls}
                        />
                        <input
                          value={ed.year}
                          onChange={(e) =>
                            setEducation(
                              education.map((x, j) => (j === i ? { ...x, year: e.target.value } : x))
                            )
                          }
                          placeholder="Passing Year (e.g. 2024)"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setEducation([...education, { school: "", degree: "", year: "" }])}
                    className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold hover:underline"
                  >
                    <Plus className="w-4 h-4" /> Add Education
                  </button>
                </div>
              )}

              {activeTab === "experience" && (
                <div className="space-y-4">
                  {experience.map((ex, i) => (
                    <div key={i} className="space-y-3 border border-border rounded-lg p-4 bg-bg-primary/30 relative">
                      <button
                        onClick={() => setExperience(experience.filter((_, j) => j !== i))}
                        className="absolute top-3 right-3 text-text-muted hover:text-danger transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={ex.role}
                          onChange={(e) =>
                            setExperience(
                              experience.map((x, j) => (j === i ? { ...x, role: e.target.value } : x))
                            )
                          }
                          placeholder="Job Title / Role"
                          className={inputCls}
                        />
                        <input
                          value={ex.org}
                          onChange={(e) =>
                            setExperience(
                              experience.map((x, j) => (j === i ? { ...x, org: e.target.value } : x))
                            )
                          }
                          placeholder="Company / Org"
                          className={inputCls}
                        />
                      </div>
                      <input
                        value={ex.period}
                        onChange={(e) =>
                          setExperience(
                            experience.map((x, j) => (j === i ? { ...x, period: e.target.value } : x))
                          )
                        }
                        placeholder="Employment Period (e.g. 2022 - Present)"
                        className={inputCls}
                      />
                      <textarea
                        value={ex.detail}
                        onChange={(e) =>
                          setExperience(
                            experience.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x))
                          )
                        }
                        placeholder="Bullet points of what you built/optimized..."
                        rows={3}
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setExperience([...experience, { role: "", org: "", period: "", detail: "" }])
                    }
                    className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold hover:underline"
                  >
                    <Plus className="w-4 h-4" /> Add Experience
                  </button>
                </div>
              )}

              {activeTab === "skills" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-primary border border-border text-xs text-text-primary"
                      >
                        {s}
                        <button
                          onClick={() => setSkills(skills.filter((x) => x !== s))}
                          className="text-text-muted hover:text-danger ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = skillInput.trim();
                        if (val && !skills.includes(val)) {
                          setSkills([...skills, val]);
                        }
                        setSkillInput("");
                      }
                    }}
                    placeholder="Add key skills (e.g. Verilog, FPGA) and press Enter"
                    className={inputCls}
                  />
                </div>
              )}

              {activeTab === "projects" && (
                <div className="space-y-4">
                  {projects.map((pr, i) => (
                    <div key={i} className="space-y-3 border border-border rounded-lg p-4 bg-bg-primary/30 relative">
                      <button
                        onClick={() => setProjects(projects.filter((_, j) => j !== i))}
                        className="absolute top-3 right-3 text-text-muted hover:text-danger transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <input
                        value={pr.name}
                        onChange={(e) =>
                          setProjects(
                            projects.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
                          )
                        }
                        placeholder="Project Title"
                        className={inputCls}
                      />
                      <textarea
                        value={pr.detail}
                        onChange={(e) =>
                          setProjects(
                            projects.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x))
                          )
                        }
                        placeholder="Explain project details, tech stack, outcomes..."
                        rows={3}
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setProjects([...projects, { name: "", detail: "" }])}
                    className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold hover:underline"
                  >
                    <Plus className="w-4 h-4" /> Add Project
                  </button>
                </div>
              )}
            </div>

            {/* ATS Feedback / Scoring Panel */}
            {atsScore !== null && (
              <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-text-primary text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    ATS Alignment Score
                  </h3>
                  <span className="text-sm font-bold text-accent">{atsScore}/100</span>
                </div>
                {feedback.length > 0 && (
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-text-secondary">
                    {feedback.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Right Live template preview panel (FlowCV styled paper) */}
          <div className="sticky top-6 bg-gray-200/50 p-6 sm:p-8 rounded-2xl border border-border shadow-inner print:p-0 print:border-none print:shadow-none">
            <div
              ref={previewRef}
              className={`bg-white shadow-xl mx-auto w-full max-w-[800px] min-h-[1050px] p-10 text-gray-900 border border-gray-300 print:shadow-none print:border-none ${fontFamily} relative`}
            >
              {/* Paper Top Accent bar */}
              <div className="absolute top-0 inset-x-0 h-2" style={{ backgroundColor: accentColor }} />

              {/* Personal Section */}
              <div className="mb-6">
                <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: accentColor }}>
                  {fullName || "John Doe"}
                </h2>
                <p className="text-sm font-semibold text-gray-600 mt-1 uppercase tracking-wide">
                  {headline || "ASIC Design Engineer"}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-2.5 border-t border-gray-200/80 pt-2">
                  {email && <span>📧 {email}</span>}
                  {phone && <span>📞 {phone}</span>}
                  {location && <span>📍 {location}</span>}
                </div>
              </div>

              {/* Summary */}
              {summary && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-1 mb-2">
                    Profile Summary
                  </h3>
                  <p className="text-xs text-gray-700 leading-relaxed">{summary}</p>
                </div>
              )}

              {/* Experience */}
              {experience.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-1 mb-3">
                    Professional Experience
                  </h3>
                  <div className="space-y-4">
                    {experience.map((ex, i) => (
                      <div key={i} className="text-xs">
                        <div className="flex justify-between font-bold text-gray-800">
                          <span>{ex.role || "Role"} at {ex.org || "Company"}</span>
                          <span className="text-gray-500 font-normal">{ex.period}</span>
                        </div>
                        {ex.detail && (
                          <p className="text-gray-600 mt-1.5 leading-relaxed whitespace-pre-line">
                            {ex.detail}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {projects.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-1 mb-3">
                    Key Projects
                  </h3>
                  <div className="space-y-4">
                    {projects.map((pr, i) => (
                      <div key={i} className="text-xs">
                        <p className="font-bold text-gray-800">{pr.name || "Project Name"}</p>
                        {pr.detail && (
                          <p className="text-gray-600 mt-1.5 leading-relaxed">
                            {pr.detail}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {education.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-1 mb-3">
                    Education
                  </h3>
                  <div className="space-y-3">
                    {education.map((ed, i) => (
                      <div key={i} className="text-xs flex justify-between">
                        <div>
                          <p className="font-bold text-gray-800">{ed.degree || "Degree"}</p>
                          <p className="text-gray-500 mt-0.5">{ed.school || "School"}</p>
                        </div>
                        <span className="text-gray-500 font-medium">{ed.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-1 mb-2.5">
                    Skills / Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-800 text-[10px] font-semibold rounded"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
