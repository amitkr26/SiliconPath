"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface EduItem { school: string; degree: string; year: string }
interface ExpItem { role: string; org: string; period: string; detail: string }
interface ProjItem { name: string; detail: string }

const STEPS = ["Personal", "Education", "Experience", "Skills", "Projects"];

export default function ResumeBuilderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);

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

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) {
        router.push("/login?redirectTo=/resume");
        return;
      }
      const res = await fetch("/api/resume");
      if (res.ok) {
        const r = await res.json();
        if (r) {
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
        }
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
          full_name: fullName, headline, email, phone, location, summary,
          education, experience, projects, skills,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAtsScore(data.ats_score);
        setFeedback(data.ats_feedback || []);
        toast.success(`Saved! ATS score: ${data.ats_score}/100`);
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-text-muted";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Resume Builder</h1>
          {atsScore !== null && (
            <span className="text-sm font-semibold text-accent">ATS: {atsScore}/100</span>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                step === i ? "bg-accent text-white" : "bg-bg-secondary text-text-secondary border border-border"
              }`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4">
          {step === 0 && (
            <>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={inputCls} />
              <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline (e.g. RTL Design Engineer)" className={inputCls} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputCls} />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={inputCls} />
              </div>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className={inputCls} />
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Professional summary..." rows={3} className={`${inputCls} resize-none`} />
            </>
          )}

          {step === 1 && (
            <>
              {education.map((ed, i) => (
                <div key={i} className="space-y-2 border border-border rounded-lg p-3">
                  <input value={ed.school} onChange={(e) => setEducation(education.map((x, j) => j === i ? { ...x, school: e.target.value } : x))} placeholder="School / University" className={inputCls} />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={ed.degree} onChange={(e) => setEducation(education.map((x, j) => j === i ? { ...x, degree: e.target.value } : x))} placeholder="Degree" className={inputCls} />
                    <input value={ed.year} onChange={(e) => setEducation(education.map((x, j) => j === i ? { ...x, year: e.target.value } : x))} placeholder="Year" className={inputCls} />
                  </div>
                  <button onClick={() => setEducation(education.filter((_, j) => j !== i))} className="text-xs text-red-500 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove</button>
                </div>
              ))}
              <button onClick={() => setEducation([...education, { school: "", degree: "", year: "" }])} className="text-sm text-accent flex items-center gap-1"><Plus className="w-4 h-4" /> Add education</button>
            </>
          )}

          {step === 2 && (
            <>
              {experience.map((ex, i) => (
                <div key={i} className="space-y-2 border border-border rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={ex.role} onChange={(e) => setExperience(experience.map((x, j) => j === i ? { ...x, role: e.target.value } : x))} placeholder="Role" className={inputCls} />
                    <input value={ex.org} onChange={(e) => setExperience(experience.map((x, j) => j === i ? { ...x, org: e.target.value } : x))} placeholder="Organization" className={inputCls} />
                  </div>
                  <input value={ex.period} onChange={(e) => setExperience(experience.map((x, j) => j === i ? { ...x, period: e.target.value } : x))} placeholder="Period (e.g. 2023-2025)" className={inputCls} />
                  <textarea value={ex.detail} onChange={(e) => setExperience(experience.map((x, j) => j === i ? { ...x, detail: e.target.value } : x))} placeholder="What you did..." rows={2} className={`${inputCls} resize-none`} />
                  <button onClick={() => setExperience(experience.filter((_, j) => j !== i))} className="text-xs text-red-500 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove</button>
                </div>
              ))}
              <button onClick={() => setExperience([...experience, { role: "", org: "", period: "", detail: "" }])} className="text-sm text-accent flex items-center gap-1"><Plus className="w-4 h-4" /> Add experience</button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-bg-primary border border-border text-xs text-text-primary">
                    {s}
                    <button onClick={() => setSkills(skills.filter((x) => x !== s))} className="text-text-muted hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = skillInput.trim(); if (v && !skills.includes(v)) setSkills([...skills, v]); setSkillInput(""); } }} placeholder="Add a skill and press Enter" className={inputCls} />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              {projects.map((pr, i) => (
                <div key={i} className="space-y-2 border border-border rounded-lg p-3">
                  <input value={pr.name} onChange={(e) => setProjects(projects.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Project name" className={inputCls} />
                  <textarea value={pr.detail} onChange={(e) => setProjects(projects.map((x, j) => j === i ? { ...x, detail: e.target.value } : x))} placeholder="Description..." rows={2} className={`${inputCls} resize-none`} />
                  <button onClick={() => setProjects(projects.filter((_, j) => j !== i))} className="text-xs text-red-500 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove</button>
                </div>
              ))}
              <button onClick={() => setProjects([...projects, { name: "", detail: "" }])} className="text-sm text-accent flex items-center gap-1"><Plus className="w-4 h-4" /> Add project</button>
            </>
          )}
        </div>

        {feedback.length > 0 && (
          <div className="mt-4 bg-bg-secondary border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">ATS suggestions</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
              {feedback.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="inline-flex items-center gap-1 text-sm text-text-secondary disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="inline-flex items-center gap-1 bg-bg-secondary border border-border text-text-primary text-sm font-medium rounded-lg px-4 py-2">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 bg-accent text-white text-sm font-semibold rounded-lg px-5 py-2.5 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save & score"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
