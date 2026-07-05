// src/components/profile/ResumeBuilder.tsx
import { useState, useEffect } from "react";
import {
  Loader2, Check, Plus, X, Save, Sparkles, FileText,
  User, GraduationCap, Wrench, Briefcase, FolderGit2,
  BookOpen, Palette, Type, RefreshCw, Printer, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

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

interface ResumeBuilderProps {
  initialData: any;
  userId: string;
  onSaveProfile: (profileUpdates: any) => Promise<void>;
}

export default function ResumeBuilder({ initialData, userId, onSaveProfile }: ResumeBuilderProps) {
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // Resume Data State
  const [fullName, setFullName] = useState(initialData?.full_name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [linkedin, setLinkedin] = useState(initialData?.linkedin || "");
  const [github, setGithub] = useState(initialData?.github || "");
  const [location, setLocation] = useState(initialData?.location || "India");
  const [headline, setHeadline] = useState(initialData?.headline || "");
  const [summary, setSummary] = useState(initialData?.summary || "");

  const [education, setEducation] = useState<EducationEntry[]>(initialData?.education || []);
  const [skills, setSkills] = useState<string[]>(initialData?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState<ExperienceEntry[]>(initialData?.experience || []);
  const [projects, setProjects] = useState<ProjectEntry[]>(initialData?.projects || []);
  const [publications, setPublications] = useState<PublicationEntry[]>(initialData?.publications || []);

  // Styling Choices
  const [template, setTemplate] = useState<"classic" | "modern" | "minimal">("classic");
  const [accentColor, setAccentColor] = useState("#22D3EE"); // default cyan
  const [fontFamily, setFontFamily] = useState<"inter" | "roboto" | "outfit">("inter");
  const [spacing, setSpacing] = useState<"compact" | "normal" | "cozy">("normal");

  // Load latest database resume data
  useEffect(() => {
    fetch("/api/resume")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.full_name) {
          setFullName(data.full_name || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          setLinkedin(data.linkedin || "");
          setGithub(data.github || "");
          setLocation(data.location || "India");
          setHeadline(data.headline || "");
          setSummary(data.summary || "");
          setEducation(data.education || []);
          setSkills(data.skills || []);
          setExperience(data.experience || []);
          setProjects(data.projects || []);
          setPublications(data.publications || []);
          if (data.template) setTemplate(data.template);
          if (data.accent_color) setAccentColor(data.accent_color);
          if (data.font_family) setFontFamily(data.font_family);
          if (data.spacing) setSpacing(data.spacing);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        full_name: fullName,
        email,
        phone,
        linkedin,
        github,
        location,
        headline,
        summary,
        education,
        skills,
        experience,
        projects,
        publications,
        template,
        accent_color: accentColor,
        font_family: fontFamily,
        spacing
      };

      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(`Resume saved! ATS Score: ${result.ats_score}/100`);
        // Sync back with main user profile details
        await onSaveProfile({
          full_name: fullName,
          headline: headline,
          about: summary,
          skills: skills,
          city: location.split(",")[0]?.trim() || "",
          country: location.split(",")[1]?.trim() || "India"
        });
      } else {
        toast.error(result.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save resume");
    } finally {
      setSaving(false);
    }
  };

  // AI Enhancer integration
  const triggerAiEnhancement = async (type: string, payload: any, setter: (val: string) => void) => {
    setAiLoading(type);
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enhance_resume_section",
          sectionType: type,
          content: payload
        })
      });
      const data = await res.json();
      if (data.enhancedText) {
        setter(data.enhancedText);
        toast.success("AI updated successfully!");
      } else {
        toast.error("Failed to get suggestion");
      }
    } catch {
      toast.error("AI service error");
    } finally {
      setAiLoading(null);
    }
  };

  // Printing/Export handler
  const handlePrint = () => {
    window.print();
  };

  // Lists helpers
  const addEdu = () => setEducation([...education, { institution: "", degree: "", field: "", year: "", cgpa: "" }]);
  const removeEdu = (i: number) => setEducation(education.filter((_, idx) => idx !== i));
  const updateEdu = (i: number, key: keyof EducationEntry, val: string) => {
    const next = [...education];
    next[i][key] = val;
    setEducation(next);
  };

  const addExp = () => setExperience([...experience, { company: "", role: "", duration: "", description: "" }]);
  const removeExp = (i: number) => setExperience(experience.filter((_, idx) => idx !== i));
  const updateExp = (i: number, key: keyof ExperienceEntry, val: string) => {
    const next = [...experience];
    next[i][key] = val;
    setExperience(next);
  };

  const addProj = () => setProjects([...projects, { name: "", description: "", technologies: "", link: "" }]);
  const removeProj = (i: number) => setProjects(projects.filter((_, idx) => idx !== i));
  const updateProj = (i: number, key: keyof ProjectEntry, val: string) => {
    const next = [...projects];
    next[i][key] = val;
    setProjects(next);
  };

  const addPub = () => setPublications([...publications, { title: "", venue: "", year: "", doi: "" }]);
  const removePub = (i: number) => setPublications(publications.filter((_, idx) => idx !== i));
  const updatePub = (i: number, key: keyof PublicationEntry, val: string) => {
    const next = [...publications];
    next[i][key] = val;
    setPublications(next);
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
    }
    setSkillInput("");
  };

  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  // Font class switcher
  const getFontClass = () => {
    if (fontFamily === "roboto") return "font-sans tracking-wide";
    if (fontFamily === "outfit") return "font-display tracking-tight";
    return "font-sans";
  };

  // Spacing spacing switcher
  const getSpacingClass = () => {
    if (spacing === "compact") return "space-y-2 text-xs";
    if (spacing === "cozy") return "space-y-6 text-sm";
    return "space-y-4 text-sm";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4">
      {/* Editor Column */}
      <div className="lg:col-span-6 space-y-6 max-h-[75vh] overflow-y-auto pr-2">
        {/* Style Customizer Panel */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold text-text-primary">
            <Palette className="w-4 h-4 text-accent" /> Style Customizer
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-xs mb-1.5">Template Layout</label>
              <select
                value={template}
                onChange={(e: any) => setTemplate(e.target.value)}
                className="w-full bg-bg-primary border border-border text-text-primary text-xs rounded-lg px-2.5 py-2 outline-none focus:border-accent"
              >
                <option value="classic">Classic (Single Page)</option>
                <option value="modern">Modern (Split Column)</option>
                <option value="minimal">Minimalist (Clean)</option>
              </select>
            </div>
            <div>
              <label className="block text-text-secondary text-xs mb-1.5">Typography Font</label>
              <select
                value={fontFamily}
                onChange={(e: any) => setFontFamily(e.target.value)}
                className="w-full bg-bg-primary border border-border text-text-primary text-xs rounded-lg px-2.5 py-2 outline-none focus:border-accent"
              >
                <option value="inter">Inter (Default)</option>
                <option value="roboto">Roboto (Sleek)</option>
                <option value="outfit">Outfit (Modern)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-text-secondary text-xs mb-1.5">Accent Styling Color</label>
              <div className="flex gap-2">
                {["#22D3EE", "#10B981", "#A855F7", "#EC4899", "#F59E0B"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setAccentColor(c)}
                    className="w-6 h-6 rounded-full border border-border flex items-center justify-center"
                    style={{ backgroundColor: c }}
                  >
                    {accentColor === c && <Check className="w-3 h-3 text-bg-primary font-bold" />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-text-secondary text-xs mb-1.5">Page Margins Spacing</label>
              <div className="flex gap-1 bg-bg-primary p-0.5 border border-border rounded-lg">
                {(["compact", "normal", "cozy"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpacing(s)}
                    className={`px-3 py-1 rounded-md text-[10px] font-medium capitalize transition-all ${
                      spacing === s ? "bg-accent text-bg-primary" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Accordion: Personal Info */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold text-text-primary">
            <User className="w-4 h-4 text-accent" /> Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary text-xs mb-1">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-bg-primary border border-border text-text-primary text-xs rounded-lg px-2.5 py-2 focus:border-accent outline-none" />
            </div>
            <div>
              <label className="block text-text-secondary text-xs mb-1">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-bg-primary border border-border text-text-primary text-xs rounded-lg px-2.5 py-2 focus:border-accent outline-none" />
            </div>
            <div>
              <label className="block text-text-secondary text-xs mb-1">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-bg-primary border border-border text-text-primary text-xs rounded-lg px-2.5 py-2 focus:border-accent outline-none" />
            </div>
            <div>
              <label className="block text-text-secondary text-xs mb-1">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="New Delhi, India" className="w-full bg-bg-primary border border-border text-text-primary text-xs rounded-lg px-2.5 py-2 focus:border-accent outline-none" />
            </div>
            <div>
              <label className="block text-text-secondary text-xs mb-1">LinkedIn Profile</label>
              <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full bg-bg-primary border border-border text-text-primary text-xs rounded-lg px-2.5 py-2 focus:border-accent outline-none" />
            </div>
            <div>
              <label className="block text-text-secondary text-xs mb-1">GitHub Account</label>
              <input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." className="w-full bg-bg-primary border border-border text-text-primary text-xs rounded-lg px-2.5 py-2 focus:border-accent outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-text-secondary text-xs mb-1">Headline</label>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="RTL Design Engineer | MSc Electronics" className="w-full bg-bg-primary border border-border text-text-primary text-xs rounded-lg px-2.5 py-2 focus:border-accent outline-none" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-text-secondary text-xs font-medium">Summary Bio</label>
              <button
                onClick={() => triggerAiEnhancement("summary", { headline, skills }, setSummary)}
                disabled={aiLoading === "summary"}
                className="flex items-center gap-1 text-[10px] text-accent font-semibold hover:text-accent-hover disabled:opacity-50"
              >
                {aiLoading === "summary" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Auto-Write (AI)
              </button>
            </div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Experienced hardware designer specializing in SystemVerilog validation..."
              className="w-full bg-bg-primary border border-border text-text-primary text-xs rounded-lg px-2.5 py-2 focus:border-accent outline-none resize-none"
            />
          </div>
        </section>

        {/* Accordion: Education */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-text-primary">
              <GraduationCap className="w-4 h-4 text-accent" /> Education
            </h3>
            <button onClick={addEdu} className="flex items-center gap-1 text-xs text-accent font-bold hover:text-accent-hover">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {education.map((edu, idx) => (
            <div key={idx} className="bg-bg-primary border border-border rounded-lg p-3 space-y-2 relative">
              <button onClick={() => removeEdu(idx)} className="absolute top-2 right-2 text-text-muted hover:text-danger">
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-secondary text-[10px]">Institution</label>
                  <input value={edu.institution} onChange={(e) => updateEdu(idx, "institution", e.target.value)} className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none" />
                </div>
                <div>
                  <label className="block text-text-secondary text-[10px]">Degree</label>
                  <input value={edu.degree} onChange={(e) => updateEdu(idx, "degree", e.target.value)} className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none" />
                </div>
                <div>
                  <label className="block text-text-secondary text-[10px]">Field of Study</label>
                  <input value={edu.field} onChange={(e) => updateEdu(idx, "field", e.target.value)} className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <label className="block text-text-secondary text-[10px]">Year</label>
                    <input value={edu.year} onChange={(e) => updateEdu(idx, "year", e.target.value)} placeholder="2025" className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none" />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-[10px]">CGPA/Score</label>
                    <input value={edu.cgpa} onChange={(e) => updateEdu(idx, "cgpa", e.target.value)} placeholder="9.2" className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Accordion: Work Experience */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-text-primary">
              <Briefcase className="w-4 h-4 text-accent" /> Work Experience
            </h3>
            <button onClick={addExp} className="flex items-center gap-1 text-xs text-accent font-bold hover:text-accent-hover">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {experience.map((exp, idx) => (
            <div key={idx} className="bg-bg-primary border border-border rounded-lg p-3 space-y-2 relative">
              <button onClick={() => removeExp(idx)} className="absolute top-2 right-2 text-text-muted hover:text-danger">
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-secondary text-[10px]">Company Name</label>
                  <input value={exp.company} onChange={(e) => updateExp(idx, "company", e.target.value)} className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none" />
                </div>
                <div>
                  <label className="block text-text-secondary text-[10px]">Role/Title</label>
                  <input value={exp.role} onChange={(e) => updateExp(idx, "role", e.target.value)} className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-text-secondary text-[10px]">Duration (e.g. 2023 - Present)</label>
                  <input value={exp.duration} onChange={(e) => updateExp(idx, "duration", e.target.value)} className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none" />
                </div>
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-text-secondary text-[10px]">Responsibilities & Highlights</label>
                    <button
                      onClick={() => triggerAiEnhancement(`experience_${idx}`, exp.description, (val) => updateExp(idx, "description", val))}
                      disabled={aiLoading === `experience_${idx}`}
                      className="flex items-center gap-0.5 text-[9px] text-accent font-semibold hover:text-accent-hover"
                    >
                      {aiLoading === `experience_${idx}` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                      Enhance Description (AI)
                    </button>
                  </div>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExp(idx, "description", e.target.value)}
                    rows={3}
                    placeholder="List key responsibilities, tools used, metrics achieved..."
                    className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Accordion: Projects */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-text-primary">
              <FolderGit2 className="w-4 h-4 text-accent" /> Projects
            </h3>
            <button onClick={addProj} className="flex items-center gap-1 text-xs text-accent font-bold hover:text-accent-hover">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {projects.map((proj, idx) => (
            <div key={idx} className="bg-bg-primary border border-border rounded-lg p-3 space-y-2 relative">
              <button onClick={() => removeProj(idx)} className="absolute top-2 right-2 text-text-muted hover:text-danger">
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-secondary text-[10px]">Project Title</label>
                  <input value={proj.name} onChange={(e) => updateProj(idx, "name", e.target.value)} className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none" />
                </div>
                <div>
                  <label className="block text-text-secondary text-[10px]">Technologies Used</label>
                  <input value={proj.technologies} onChange={(e) => updateProj(idx, "technologies", e.target.value)} placeholder="Verilog, Vivado" className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-text-secondary text-[10px]">Project Link</label>
                  <input value={proj.link} onChange={(e) => updateProj(idx, "link", e.target.value)} placeholder="https://github.com/..." className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none" />
                </div>
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-text-secondary text-[10px]">Details & Architecture</label>
                    <button
                      onClick={() => triggerAiEnhancement(`project_${idx}`, proj.description, (val) => updateProj(idx, "description", val))}
                      disabled={aiLoading === `project_${idx}`}
                      className="flex items-center gap-0.5 text-[9px] text-accent font-semibold hover:text-accent-hover"
                    >
                      {aiLoading === `project_${idx}` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                      Enhance Description (AI)
                    </button>
                  </div>
                  <textarea
                    value={proj.description}
                    onChange={(e) => updateProj(idx, "description", e.target.value)}
                    rows={3}
                    placeholder="Describe goals, circuit elements, FSM design, verification results..."
                    className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Accordion: Publications */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-text-primary">
              <BookOpen className="w-4 h-4 text-accent" /> Research Publications
            </h3>
            <button onClick={addPub} className="flex items-center gap-1 text-xs text-accent font-bold hover:text-accent-hover">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {publications.map((pub, idx) => (
            <div key={idx} className="bg-bg-primary border border-border rounded-lg p-3 space-y-2 relative">
              <button onClick={() => removePub(idx)} className="absolute top-2 right-2 text-text-muted hover:text-danger">
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="block text-text-secondary text-[10px]">Paper Title</label>
                  <input value={pub.title} onChange={(e) => updatePub(idx, "title", e.target.value)} className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none" />
                </div>
                <div>
                  <label className="block text-text-secondary text-[10px]">Journal / Venue</label>
                  <input value={pub.venue} onChange={(e) => updatePub(idx, "venue", e.target.value)} className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <label className="block text-text-secondary text-[10px]">Year</label>
                    <input value={pub.year} onChange={(e) => updatePub(idx, "year", e.target.value)} className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none" />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-[10px]">DOI/Link</label>
                    <input value={pub.doi} onChange={(e) => updatePub(idx, "doi", e.target.value)} className="w-full bg-surface border border-border text-text-primary text-xs rounded px-2 py-1 focus:border-accent outline-none" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Accordion: Skills */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold text-text-primary">
            <Wrench className="w-4 h-4 text-accent" /> Skills Keywords
          </h3>
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
              placeholder="Add skill keyword..."
              className="flex-1 bg-bg-primary border border-border text-text-primary text-xs rounded-lg px-2.5 py-2 focus:border-accent outline-none"
            />
            <button onClick={addSkill} className="bg-accent text-bg-primary font-bold px-4 rounded-lg text-xs hover:bg-accent-hover transition-colors">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/10 border border-accent/20 text-accent rounded-full text-[10px] font-semibold">
                {s}
                <button onClick={() => removeSkill(s)} className="text-text-muted hover:text-danger">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Save & Print Panel */}
        <div className="flex gap-2 p-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-accent text-bg-primary font-bold rounded-lg py-3 text-sm hover:bg-accent-hover transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Update Profile
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-surface-elevated border border-border text-text-primary font-bold rounded-lg px-5 py-3 text-sm hover:text-accent hover:border-accent transition-all"
          >
            <Printer className="w-4 h-4" />
            Print / Export PDF
          </button>
        </div>
      </div>

      {/* Sticky Real-time Preview Column */}
      <div className="lg:col-span-6 relative">
        <div className="sticky top-4 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs text-text-secondary flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent animate-pulse" /> Real-time A4 Print Preview
            </span>
            <span className="text-[10px] text-text-muted">Use Ctrl+P or click Export PDF to save</span>
          </div>

          {/* Virtual Paper Sheet */}
          <div className="border border-border/50 bg-white text-black p-8 rounded-lg shadow-2xl max-h-[70vh] overflow-y-auto aspect-[1/1.414] no-scrollbar">
            <div className={`resume-print-area text-black ${getFontClass()} ${getSpacingClass()}`} style={{ fontSize: "12px", lineHeight: "1.4" }}>
              
              {/* Template: Classic or Minimal */}
              {(template === "classic" || template === "minimal") && (
                <div className="space-y-4">
                  <div className="text-center border-b pb-3" style={{ borderColor: accentColor }}>
                    <h1 className="text-xl font-bold tracking-tight uppercase" style={{ color: accentColor }}>{fullName || "Full Name"}</h1>
                    {headline && <p className="text-xs font-semibold text-gray-600 mt-1 uppercase tracking-wider">{headline}</p>}
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-gray-500 mt-1.5 font-medium">
                      {email && <span>{email}</span>}
                      {phone && <span>{phone}</span>}
                      {location && <span>{location}</span>}
                      {linkedin && <span>{linkedin.replace(/^https?:\/\//, "")}</span>}
                      {github && <span>{github.replace(/^https?:\/\//, "")}</span>}
                    </div>
                  </div>

                  {summary && (
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>Professional Summary</h4>
                      <p className="text-xs text-gray-700 font-light">{summary}</p>
                    </div>
                  )}

                  {experience.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accentColor, borderColor: `${accentColor}33` }}>Experience</h4>
                      <div className="space-y-2.5">
                        {experience.map((exp, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>{exp.role} — <span style={{ color: accentColor }}>{exp.company}</span></span>
                              <span className="text-[10px] text-gray-500 font-normal">{exp.duration}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 font-light whitespace-pre-line">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {education.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accentColor, borderColor: `${accentColor}33` }}>Education</h4>
                      <div className="space-y-1.5">
                        {education.map((edu, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <div>
                              <span className="font-semibold">{edu.degree} in {edu.field}</span>
                              <span className="text-gray-500 text-[11px]"> · {edu.institution}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-semibold">{edu.year} {edu.cgpa && `(CGPA: ${edu.cgpa})`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {projects.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accentColor, borderColor: `${accentColor}33` }}>Projects</h4>
                      <div className="space-y-2.5">
                        {projects.map((proj, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>{proj.name}</span>
                              {proj.technologies && <span className="text-[10px] font-normal text-gray-500">[{proj.technologies}]</span>}
                            </div>
                            <p className="text-[11px] text-gray-600 font-light">{proj.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {publications.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accentColor, borderColor: `${accentColor}33` }}>Publications</h4>
                      <div className="space-y-1.5">
                        {publications.map((pub, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-semibold">{pub.title}</span>
                            <span className="text-gray-500 text-[11px]"> — {pub.venue} ({pub.year})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {skills.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>Skills</h4>
                      <p className="text-xs text-gray-700 font-light tracking-wide">{skills.join(" · ")}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Template: Modern (Split Column) */}
              {template === "modern" && (
                <div className="grid grid-cols-12 gap-4 h-full">
                  {/* Left Column Sidebar */}
                  <div className="col-span-4 bg-gray-50 p-3 rounded-l-lg border-r border-gray-200/50 space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-sm font-bold tracking-tight uppercase" style={{ color: accentColor }}>Contact</h2>
                      <div className="space-y-1 text-[9px] text-gray-600 font-medium break-all">
                        {email && <p>{email}</p>}
                        {phone && <p>{phone}</p>}
                        {location && <p>{location}</p>}
                        {linkedin && <p className="text-[8px]">{linkedin.replace(/^https?:\/\//, "")}</p>}
                        {github && <p className="text-[8px]">{github.replace(/^https?:\/\//, "")}</p>}
                      </div>
                    </div>

                    {education.length > 0 && (
                      <div className="space-y-1.5">
                        <h2 className="text-sm font-bold tracking-tight uppercase" style={{ color: accentColor }}>Education</h2>
                        <div className="space-y-2">
                          {education.map((edu, idx) => (
                            <div key={idx} className="text-[9px] leading-tight">
                              <p className="font-bold">{edu.degree}</p>
                              <p className="text-gray-500">{edu.field}</p>
                              <p className="text-gray-400">{edu.institution} ({edu.year})</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {skills.length > 0 && (
                      <div className="space-y-1.5">
                        <h2 className="text-sm font-bold tracking-tight uppercase" style={{ color: accentColor }}>Skills</h2>
                        <div className="flex flex-wrap gap-1">
                          {skills.map((s) => (
                            <span key={s} className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-[8px] font-semibold rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column Body */}
                  <div className="col-span-8 space-y-4 pt-1">
                    <div>
                      <h1 className="text-lg font-bold tracking-tight uppercase" style={{ color: accentColor }}>{fullName || "Full Name"}</h1>
                      {headline && <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{headline}</p>}
                    </div>

                    {summary && (
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accentColor, borderColor: `${accentColor}33` }}>Summary</h4>
                        <p className="text-[10px] text-gray-700 font-light leading-snug">{summary}</p>
                      </div>
                    )}

                    {experience.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accentColor, borderColor: `${accentColor}33` }}>Experience</h4>
                        <div className="space-y-2">
                          {experience.map((exp, idx) => (
                            <div key={idx} className="space-y-0.5 leading-tight">
                              <p className="text-[10px] font-bold">{exp.role} <span className="font-normal text-gray-500">at</span> {exp.company}</p>
                              <p className="text-[8px] text-gray-400 font-semibold">{exp.duration}</p>
                              <p className="text-[9px] text-gray-600 font-light whitespace-pre-line">{exp.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {projects.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accentColor, borderColor: `${accentColor}33` }}>Projects</h4>
                        <div className="space-y-2">
                          {projects.map((proj, idx) => (
                            <div key={idx} className="space-y-0.5 leading-tight">
                              <p className="text-[10px] font-bold">{proj.name} {proj.technologies && <span className="text-[8px] font-normal text-gray-400">[{proj.technologies}]</span>}</p>
                              <p className="text-[9px] text-gray-600 font-light">{proj.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {publications.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accentColor, borderColor: `${accentColor}33` }}>Publications</h4>
                        <div className="space-y-1.5">
                          {publications.map((pub, idx) => (
                            <div key={idx} className="text-[9px]">
                              <p className="font-semibold">{pub.title}</p>
                              <p className="text-gray-500">{pub.venue} ({pub.year})</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
