"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight, Plus, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface EduItem { school: string; degree: string; year: string }
interface ExpItem { company: string; role: string; period: string; summary: string }
interface ProjItem { name: string; description: string }

const STEPS = ["Personal", "Education", "Experience", "Skills", "Projects"] as const;

export default function ResumeBuilderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [atsScore, setAtsScore] = useState<number | null>(null);

  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [location, setLocation] = useState("");
  const [education, setEducation] = useState<EduItem[]>([]);
  const [experience, setExperience] = useState<ExpItem[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [projects, setProjects] = useState<ProjItem[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) {
        router.push("/login?redirectTo=/resume");
        return;
      }
      const { data: p } = await supabase.from("user_profiles").select("*").eq("id", data.user.id).maybeSingle();
      if (p) {
        setFullName(p.display_name || p.full_name || "");
        setHeadline(p.headline || "");
        setSummary(p.bio || p.about || "");
        setLocation([p.location, p.country].filter(Boolean).join(", "));
        setSkills(p.skills || []);
        if (Array.isArray(p.education)) setEducation(p.education);
        if (Array.isArray(p.experience)) setExperience(p.experience);
        if (Array.isArray(p.projects)) setProjects(p.projects);
      }
      setLoading(false);
    });
  }, [router]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          headline,
          summary,
          location,
          education,
          experience,
          skills,
          projects,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAtsScore(typeof data.ats_score === "number" ? data.ats_score : null);
        toast.success("Resume saved!");
      } else {
        toast.error("Failed to save resume");
      }
    } catch {
      toast.error("Failed to save resume");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const inputCls =
    "w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-text-muted";

  return (
    <div className="min-h-screen bg-bg-primary py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Resume Builder</h1>
        <p className="text-sm text-text-secondary mb-6">Build an ATS-friendly resume for VLSI and semiconductor roles.</p>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto">
          {STEPS.map((label, i) => (
            <button
              key={label}
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                i === step ? "bg-accent text-white" : i < step ? "text-accent" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${i === step ? "bg-white/20" : "bg-bg-secondary border border-border"}`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {label}
            </button>
          ))}
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4">
          {step === 0 && (
            <>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Full name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Headline</label>
                <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="VLSI Design Engineer" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bangalore, India" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Summary</label>
                <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} className={`${inputCls} resize-none`} />
              </div>
            </>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {education.map((ed, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input value={ed.school} onChange={(e) => setEducation(education.map((x, j) => j === i ? { ...x, school: e.target.value } : x))} placeholder="Institute" className={inputCls} />
                  <input value={ed.degree} onChange={(e) => setEducation(education.map((x, j) => j === i ? { ...x, degree: e.target.value } : x))} placeholder="Degree" className={inputCls} />
                  <div className="flex gap-2">
                    <input value={ed.year} onChange={(e) => setEducation(education.map((x, j) => j === i ? { ...x, year: e.target.value } : x))} placeholder="Year" className={inputCls} />
                    <button onClick={() => setEducation(education.filter((_, j) => j !== i))} className="text-text-muted hover:text-danger"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              <button onClick={() => setEducation([...education, { school: "", degree: "", year: "" }])} className="inline-flex items-center gap-1 text-sm text-accent">
                <Plus className="w-4 h-4" /> Add education
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {experience.map((ex, i) => (
                <div key={i} className="space-y-2 border border-border rounded-lg p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input value={ex.company} onChange={(e) => setExperience(experience.map((x, j) => j === i ? { ...x, company: e.target.value } : x))} placeholder="Company" className={inputCls} />
                    <input value={ex.role} onChange={(e) => setExperience(experience.map((x, j) => j === i ? { ...x, role: e.target.value } : x))} placeholder="Role" className={inputCls} />
                  </div>
                  <input value={ex.period} onChange={(e) => setExperience(experience.map((x, j) => j === i ? { ...x, period: e.target.value } : x))} placeholder="2023 - Present" className={inputCls} />
                  <textarea value={ex.summary} onChange={(e) => setExperience(experience.map((x, j) => j === i ? { ...x, summary: e.target.value } : x))} placeholder="What you did" rows={2} className={`${inputCls} resize-none`} />
                  <button onClick={() => setExperience(experience.filter((_, j) => j !== i))} className="inline-flex items-center gap-1 text-xs text-danger"><X className="w-3.5 h-3.5" /> Remove</button>
                </div>
              ))}
              <button onClick={() => setExperience([...experience, { company: "", role: "", period: "", summary: "" }])} className="inline-flex items-center gap-1 text-sm text-accent">
                <Plus className="w-4 h-4" /> Add experience
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-bg-primary border border-border text-xs text-text-primary">
                  {s}
                  <button onClick={() => setSkills(skills.filter((x) => x !== s))} className="text-text-muted hover:text-danger"><X className="w-3 h-3" /></button>
                </span>
              ))}
              <div className="inline-flex items-center gap-1">
                <input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const s = newSkill.trim(); if (s && !skills.includes(s)) setSkills([...skills, s]); setNewSkill(""); } }}
                  placeholder="Add skill"
                  className="w-28 bg-bg-primary border border-border text-text-primary text-xs rounded-full px-3 py-1.5 outline-none"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              {projects.map((pr, i) => (
                <div key={i} className="space-y-2 border border-border rounded-lg p-3">
                  <input value={pr.name} onChange={(e) => setProjects(projects.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Project name" className={inputCls} />
                  <textarea value={pr.description} onChange={(e) => setProjects(projects.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} placeholder="Description" rows={2} className={`${inputCls} resize-none`} />
                  <button onClick={() => setProjects(projects.filter((_, j) => j !== i))} className="inline-flex items-center gap-1 text-xs text-danger"><X className="w-3.5 h-3.5" /> Remove</button>
                </div>
              ))}
              <button onClick={() => setProjects([...projects, { name: "", description: "" }])} className="inline-flex items-center gap-1 text-sm text-accent">
                <Plus className="w-4 h-4" /> Add project
              </button>
            </div>
          )}
        </div>

        {atsScore !== null && (
          <div className="mt-4 bg-bg-secondary border border-border rounded-xl p-4">
            <p className="text-sm text-text-secondary">ATS score: <span className="font-bold text-text-primary">{atsScore}/100</span></p>
          </div>
        )}

        {/* Nav */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-border text-sm text-text-secondary disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Saving..." : "Save resume"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
