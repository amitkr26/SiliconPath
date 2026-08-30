"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Save, Plus, Trash2, User,
  Briefcase, GraduationCap, Code, FolderGit2, Download, Sparkles,
  UploadCloud, FileText, CheckCircle2
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface EduItem { school: string; degree: string; year: string }
interface ExpItem { role: string; org: string; period: string; detail: string }
interface ProjItem { name: string; detail: string }

type TabId = "personal" | "education" | "experience" | "skills" | "projects";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "personal", label: "Personal", icon: <User className="w-3.5 h-3.5" /> },
  { id: "education", label: "Education", icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { id: "experience", label: "Experience", icon: <Briefcase className="w-3.5 h-3.5" /> },
  { id: "skills", label: "Skills", icon: <Code className="w-3.5 h-3.5" /> },
  { id: "projects", label: "Projects", icon: <FolderGit2 className="w-3.5 h-3.5" /> },
];

export default function ResumeBuilderPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [accentColor, setAccentColor] = useState("#2563EB");
  const [fontFamily, setFontFamily] = useState("font-sans");

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.name.match(/\.(pdf|txt|docx|md)$/i)) {
      toast.error("Please upload a PDF, DOCX, or TXT resume file.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profile/parse-resume", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to parse resume");
      }
      const p = data.profile || {};
      if (p.full_name) setFullName(p.full_name);
      if (p.headline) setHeadline(p.headline);
      if (p.email) setEmail(p.email);
      if (p.phone) setPhone(p.phone);
      if (p.city || p.location) setLocation(p.city || p.location);
      if (p.about || p.summary) setSummary(p.about || p.summary);

      if (Array.isArray(p.skills) && p.skills.length > 0) {
        setSkills((prev) => Array.from(new Set([...prev, ...p.skills])));
      }
      if (Array.isArray(p.experience) && p.experience.length > 0) {
        const mappedExp: ExpItem[] = p.experience.map((e: any) => ({
          role: e.role || "Role",
          org: e.company || e.org || "Organization",
          period: e.duration || e.period || "",
          detail: e.description || e.detail || "",
        }));
        setExperience((prev) => [...prev, ...mappedExp]);
      }
      if (Array.isArray(p.education) && p.education.length > 0) {
        const mappedEdu: EduItem[] = p.education.map((ed: any) => ({
          school: ed.institution || ed.school || "University",
          degree: ed.degree || "Degree",
          year: ed.duration || ed.year || "",
        }));
        setEducation((prev) => [...prev, ...mappedEdu]);
      }
      if (Array.isArray(p.projects) && p.projects.length > 0) {
        const mappedProj: ProjItem[] = p.projects.map((pr: any) => ({
          name: pr.name || "Project",
          detail: pr.description || pr.detail || "",
        }));
        setProjects((prev) => [...prev, ...mappedProj]);
      }
      toast.success("Resume parsed & auto-filled successfully! All fields are ready to edit.");
    } catch (err: any) {
      toast.error(err.message || "Could not parse resume");
    } finally {
      setUploading(false);
    }
  };

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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const textareaCls =
    "w-full px-3.5 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-brutal-sm focus:outline-none focus:border-accent focus:shadow-brutal transition-all resize-none";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-bg-primary py-8 print:p-0 print:bg-white print:min-h-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:p-0">

        {/* Header Control Panel */}
        <SectionHeader
          className="print:hidden"
          eyebrow="Resume Builder"
          title="Berojgar Resume Builder"
          description="Create a custom single-page profile resume tailored for VLSI, semiconductor, and hardware jobs."
          action={
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" type="button" onClick={handlePrint}>
                <Download className="w-4 h-4" /> Print / PDF
              </Button>
              <Button type="button" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save & Analyze"}
              </Button>
            </div>
          }
        />

        {/* Builder Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start print:block">

          {/* Left Editor Console */}
          <div className="space-y-6 print:hidden">
            {/* Resume Upload & Auto-Fill Card */}
            <Card className="p-5 space-y-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border-2 border-blue-600/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Upload & Auto-Fill Resume</h3>
                    <p className="text-xs text-slate-600">Upload your PDF or TXT resume to automatically populate all fields below</p>
                  </div>
                </div>
                {uploading && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing...</span>
                  </div>
                )}
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFileUpload(f);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-blue-600 bg-blue-100/50 scale-[1.01]"
                    : "border-slate-300 hover:border-blue-500 hover:bg-white/80"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.docx,.md"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {uploading ? "Extracting resume details..." : "Click or drag & drop your resume file here (.pdf, .txt, .docx)"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Auto-detects contact info, experience, education, skills & projects for 1-click editing
                  </span>
                </div>
              </div>
            </Card>

            {/* Editor Tabs Navigation */}
            <div className="flex bg-white border-2 border-slate-900 rounded-xl p-1.5 gap-1 overflow-x-auto whitespace-nowrap shadow-brutal">
              {TABS.map((tab) => (
                <Button
                  key={tab.id}
                  type="button"
                  variant={activeTab === tab.id ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className="whitespace-nowrap"
                >
                  {tab.icon} {tab.label}
                </Button>
              ))}
            </div>

            {/* Design & Styles Tool Box */}
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-black text-slate-900">Resume Customization</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">Accent Color</label>
                  <div className="flex gap-2.5">
                    {["#2563EB", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"].map((color) => (
                      <button
                        key={color}
                        onClick={() => setAccentColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          accentColor === color ? "scale-125 border-slate-900" : "border-slate-300"
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Accent color ${color}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">Font Style</label>
                  <Select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="py-1.5 text-xs"
                  >
                    <option value="font-sans">Modern Sans</option>
                    <option value="font-serif">Classic Serif</option>
                    <option value="font-mono">Technical Mono</option>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Active Section Form Fields */}
            <Card className="p-6 space-y-5">
              {activeTab === "personal" && (
                <div className="space-y-4">
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                  />
                  <Input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Professional Headline (e.g. ASIC Design Engineer)"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      type="email"
                    />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone Number"
                    />
                  </div>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location (e.g. Bengaluru, India)"
                  />
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Professional Summary / Profile statement..."
                    rows={4}
                    className={textareaCls}
                  />
                </div>
              )}

              {activeTab === "education" && (
                <div className="space-y-4">
                  {education.map((ed, i) => (
                    <div key={i} className="relative space-y-3 border-2 border-slate-900 rounded-xl p-4 bg-white shadow-brutal-sm">
                      <button
                        onClick={() => setEducation(education.filter((_, j) => j !== i))}
                        className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition"
                        aria-label="Remove education entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Input
                        value={ed.school}
                        onChange={(e) =>
                          setEducation(
                            education.map((x, j) => (j === i ? { ...x, school: e.target.value } : x))
                          )
                        }
                        placeholder="School / University"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={ed.degree}
                          onChange={(e) =>
                            setEducation(
                              education.map((x, j) => (j === i ? { ...x, degree: e.target.value } : x))
                            )
                          }
                          placeholder="Degree / Course"
                        />
                        <Input
                          value={ed.year}
                          onChange={(e) =>
                            setEducation(
                              education.map((x, j) => (j === i ? { ...x, year: e.target.value } : x))
                            )
                          }
                          placeholder="Passing Year (e.g. 2024)"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setEducation([...education, { school: "", degree: "", year: "" }])}
                    className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-semibold hover:underline"
                  >
                    <Plus className="w-4 h-4" /> Add Education
                  </button>
                </div>
              )}

              {activeTab === "experience" && (
                <div className="space-y-4">
                  {experience.map((ex, i) => (
                    <div key={i} className="relative space-y-3 border-2 border-slate-900 rounded-xl p-4 bg-white shadow-brutal-sm">
                      <button
                        onClick={() => setExperience(experience.filter((_, j) => j !== i))}
                        className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition"
                        aria-label="Remove experience entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={ex.role}
                          onChange={(e) =>
                            setExperience(
                              experience.map((x, j) => (j === i ? { ...x, role: e.target.value } : x))
                            )
                          }
                          placeholder="Job Title / Role"
                        />
                        <Input
                          value={ex.org}
                          onChange={(e) =>
                            setExperience(
                              experience.map((x, j) => (j === i ? { ...x, org: e.target.value } : x))
                            )
                          }
                          placeholder="Company / Org"
                        />
                      </div>
                      <Input
                        value={ex.period}
                        onChange={(e) =>
                          setExperience(
                            experience.map((x, j) => (j === i ? { ...x, period: e.target.value } : x))
                          )
                        }
                        placeholder="Employment Period (e.g. 2022 - Present)"
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
                        className={textareaCls}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setExperience([...experience, { role: "", org: "", period: "", detail: "" }])
                    }
                    className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-semibold hover:underline"
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border-2 border-slate-900 text-xs font-semibold text-slate-900 shadow-brutal-sm"
                      >
                        {s}
                        <button
                          onClick={() => setSkills(skills.filter((x) => x !== s))}
                          className="text-slate-400 hover:text-red-600 ml-1"
                          aria-label={`Remove skill ${s}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <Input
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
                  />
                </div>
              )}

              {activeTab === "projects" && (
                <div className="space-y-4">
                  {projects.map((pr, i) => (
                    <div key={i} className="relative space-y-3 border-2 border-slate-900 rounded-xl p-4 bg-white shadow-brutal-sm">
                      <button
                        onClick={() => setProjects(projects.filter((_, j) => j !== i))}
                        className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition"
                        aria-label="Remove project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Input
                        value={pr.name}
                        onChange={(e) =>
                          setProjects(
                            projects.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
                          )
                        }
                        placeholder="Project Title"
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
                        className={textareaCls}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setProjects([...projects, { name: "", detail: "" }])}
                    className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-semibold hover:underline"
                  >
                    <Plus className="w-4 h-4" /> Add Project
                  </button>
                </div>
              )}
            </Card>

            {/* ATS Feedback / Scoring Panel */}
            {atsScore !== null && (
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    ATS Alignment Score
                  </h3>
                  <span className="text-sm font-black text-blue-600">{atsScore}/100</span>
                </div>
                {feedback.length > 0 && (
                  <ul className="list-disc list-inside space-y-1.5 text-xs font-medium text-slate-600">
                    {feedback.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>

          {/* Right Live template preview panel (FlowCV styled paper) */}
          <div className="sticky top-6 bg-bg-secondary p-6 sm:p-8 rounded-2xl border-2 border-slate-900 shadow-brutal print:p-0 print:border-none print:shadow-none">
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