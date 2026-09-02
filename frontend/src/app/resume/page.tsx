"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Download, Save, UploadCloud, Sparkles, LayoutTemplate,
  Layers, Plus, Trash2, Eye, User, GraduationCap, Briefcase,
  Code, FolderGit2, Award, BookOpen, Loader2, ZoomIn, ZoomOut, Check, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { ResumeData, ResumeStyleConfig, TemplateId, EduItem, ExpItem, ProjItem, CertItem, PubItem } from "./types";
import { ParsedResumeProfile } from "@/lib/resume-text-parser";
import { ResumePreview } from "./components/ResumePreview";
import { TemplateSelector, TEMPLATE_OPTIONS } from "./components/TemplateSelector";
import { StyleCustomizer } from "./components/StyleCustomizer";
import { ImportReviewModal } from "./components/ImportReviewModal";
import { AIResumeAdvisor, TargetRole } from "./components/AIResumeAdvisor";
import { AIImproveDiffModal } from "./components/AIImproveDiffModal";
import { MyResumesDrawer, SavedResumeMeta } from "./components/MyResumesDrawer";

const DEFAULT_RESUME_DATA: ResumeData = {
  fullName: "Amit Kumar",
  headline: "ASIC & RTL Design Engineer | VLSI Specialist",
  email: "amit.kumar@example.com",
  phone: "+91 98765 43210",
  location: "Bengaluru, India",
  linkedin: "linkedin.com/in/amit-vlsi",
  github: "github.com/amit-chips",
  website: "",
  summary: "Results-driven Electronics & VLSI Engineer with hands-on expertise in RTL design (SystemVerilog/Verilog), logic synthesis, and digital verification. Strong foundation in microarchitecture, FSM design, and timing closure.",
  education: [
    {
      id: "edu-1",
      school: "Indian Institute of Information Technology (IIIT)",
      degree: "B.Tech in Electronics & Communication Engineering",
      year: "2020 - 2024",
      cgpa: "8.7/10",
    },
  ],
  experience: [
    {
      id: "exp-1",
      role: "RTL Design Intern",
      org: "C-DAC (Center for Development of Advanced Computing)",
      period: "Jan 2024 - Jun 2024",
      detail: "Designed and verified AMBA AXI4 interconnect modules using SystemVerilog.\nConducted logic synthesis and STA using Synopsys Design Compiler, achieving 250MHz timing closure.",
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "RISC-V 32I 5-Stage Pipelined Processor",
      technologies: "SystemVerilog, Vivado, ModelSim",
      detail: "Implemented 32-bit RISC-V RV32I core with hazard detection, branch prediction, and forwarding unit. Verified on Xilinx Artix-7 FPGA board.",
    },
    {
      id: "proj-2",
      name: "UVM-Based Verification Environment for UART Controller",
      technologies: "SystemVerilog, UVM 1.2, QuestaSim",
      detail: "Architected complete UVM testbench with scoreboard, agents, and functional coverage model, achieving 98.5% code coverage.",
    },
  ],
  skills: [
    "SystemVerilog", "Verilog", "UVM", "RTL Design", "Digital Design",
    "Logic Synthesis", "Static Timing Analysis (STA)", "Synopsys Design Compiler",
    "Cadence Virtuoso", "Xilinx Vivado", "ModelSim", "FPGA", "RISC-V", "Tcl", "Python"
  ],
  certifications: [
    { id: "cert-1", name: "Advanced VLSI & RTL Verification - C-DAC Certified", year: "2024" }
  ],
  publications: [
    { id: "pub-1", title: "Low-Power Pipelined RISC-V Microarchitecture Design", venue: "IEEE VLSID Proceedings", year: "2024" }
  ],
};

const DEFAULT_STYLE_CONFIG: ResumeStyleConfig = {
  templateId: "modern-professional",
  accentColor: "#2563EB",
  fontFamily: "font-sans",
  marginSize: "normal",
  sectionSpacing: "normal",
  visibleSections: {
    summary: true,
    experience: true,
    education: true,
    projects: true,
    skills: true,
    certifications: true,
    publications: true,
  },
};

type ActiveEditorTab = "personal" | "experience" | "education" | "skills" | "projects" | "extras" | "styling" | "ai";

export default function ResumeBuilderPage() {
  const { user } = useUser();
  const [resumeData, setResumeData] = useState<ResumeData>(DEFAULT_RESUME_DATA);
  const [styleConfig, setStyleConfig] = useState<ResumeStyleConfig>(DEFAULT_STYLE_CONFIG);
  const [activeTab, setActiveTab] = useState<ActiveEditorTab>("personal");
  const [zoomScale, setZoomScale] = useState(1.0);
  const [mobileMode, setMobileMode] = useState<"editor" | "preview">("editor");

  // Multi-resume state
  const [savedResumes, setSavedResumes] = useState<SavedResumeMeta[]>([
    {
      id: "resume-1",
      name: "Primary Resume (VLSI)",
      templateId: "modern-professional",
      updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [activeResumeId, setActiveResumeId] = useState("resume-1");

  // Modals & Drawers state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [myResumesOpen, setMyResumesOpen] = useState(false);
  const [importReviewOpen, setImportReviewOpen] = useState(false);
  const [parsedDataForReview, setParsedDataForReview] = useState<ParsedResumeProfile | null>(null);
  const [aiDiffModalOpen, setAiDiffModalOpen] = useState(false);
  const [aiDiffContext, setAiDiffContext] = useState<{
    section: string;
    itemId?: string;
    original: string;
    suggested: string;
  }>({
    section: "summary",
    itemId: undefined,
    original: "",
    suggested: "",
  });

  // Async States
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [targetRole, setTargetRole] = useState<TargetRole>("rtl-design");
  const [skillInput, setSkillInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // 1. Load draft and versions from localStorage on mount
  useEffect(() => {
    try {
      const storedMap = localStorage.getItem("bdw_resume_versions_map_v1");
      const storedList = localStorage.getItem("bdw_resume_list_v1");

      if (storedList) {
        const parsedList = JSON.parse(storedList);
        if (Array.isArray(parsedList) && parsedList.length > 0) {
          setSavedResumes(parsedList);
          const firstId = parsedList[0].id;
          setActiveResumeId(firstId);

          if (storedMap) {
            const parsedMap = JSON.parse(storedMap);
            if (parsedMap[firstId]) {
              if (parsedMap[firstId].data) setResumeData(parsedMap[firstId].data);
              if (parsedMap[firstId].style) setStyleConfig(parsedMap[firstId].style);
              return;
            }
          }
        }
      }

      // Fallback to legacy single draft
      const storedDraft = localStorage.getItem("bdw_resume_draft_v1");
      if (storedDraft) {
        const parsed = JSON.parse(storedDraft);
        if (parsed.data) setResumeData(parsed.data);
        if (parsed.style) setStyleConfig(parsed.style);
      }
    } catch {}
  }, []);

  // 2. Persist active draft and versions map to localStorage on change
  useEffect(() => {
    try {
      const currentVersion = { data: resumeData, style: styleConfig };
      localStorage.setItem("bdw_resume_draft_v1", JSON.stringify(currentVersion));

      const storedMap = localStorage.getItem("bdw_resume_versions_map_v1");
      const versionsMap = storedMap ? JSON.parse(storedMap) : {};
      versionsMap[activeResumeId] = currentVersion;
      localStorage.setItem("bdw_resume_versions_map_v1", JSON.stringify(versionsMap));
      localStorage.setItem("bdw_resume_list_v1", JSON.stringify(savedResumes));
    } catch {}
  }, [resumeData, styleConfig, activeResumeId, savedResumes]);

  // File Upload Handler (PDF, DOCX, TXT)
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.name.match(/\.(pdf|docx|txt|md|doc)$/i)) {
      toast.error("Please upload a PDF, DOCX, TXT, or MD resume file.");
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
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to extract resume data");
      }

      setParsedDataForReview(result.profile);
      setImportReviewOpen(true);
      toast.success("Resume parsed successfully! Review extracted data.");
    } catch (err: any) {
      toast.error(err.message || "Failed to parse uploaded resume");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Import Review Confirmations
  const handleApplyAllExtracted = (p: ParsedResumeProfile) => {
    setResumeData((prev) => ({
      ...prev,
      fullName: p.full_name || prev.fullName,
      headline: p.headline || prev.headline,
      email: p.email || prev.email,
      phone: p.phone || prev.phone,
      location: p.location || p.city || prev.location,
      summary: p.about || prev.summary,
      skills: p.skills && p.skills.length > 0 ? p.skills : prev.skills,
      education: p.education && p.education.length > 0
        ? p.education.map((e, idx) => ({ id: `edu-${Date.now()}-${idx}`, school: e.institution, degree: e.degree, year: e.duration, cgpa: e.cgpa }))
        : prev.education,
      experience: p.experience && p.experience.length > 0
        ? p.experience.map((e, idx) => ({ id: `exp-${Date.now()}-${idx}`, role: e.role, org: e.company, period: e.duration, detail: e.description }))
        : prev.experience,
      projects: p.projects && p.projects.length > 0
        ? p.projects.map((pr, idx) => ({ id: `proj-${Date.now()}-${idx}`, name: pr.name, detail: pr.description, technologies: pr.technologies }))
        : prev.projects,
    }));
    setImportReviewOpen(false);
    toast.success("All extracted fields applied to your resume!");
  };

  const handleMergeExtracted = (p: ParsedResumeProfile) => {
    setResumeData((prev) => ({
      ...prev,
      skills: Array.from(new Set([...prev.skills, ...(p.skills || [])])),
      education: [
        ...prev.education,
        ...(p.education || []).map((e, idx) => ({ id: `edu-${Date.now()}-${idx}`, school: e.institution, degree: e.degree, year: e.duration, cgpa: e.cgpa })),
      ],
      experience: [
        ...prev.experience,
        ...(p.experience || []).map((e, idx) => ({ id: `exp-${Date.now()}-${idx}`, role: e.role, org: e.company, period: e.duration, detail: e.description })),
      ],
      projects: [
        ...prev.projects,
        ...(p.projects || []).map((pr, idx) => ({ id: `proj-${Date.now()}-${idx}`, name: pr.name, detail: pr.description, technologies: pr.technologies })),
      ],
    }));
    setImportReviewOpen(false);
    toast.success("Extracted sections merged with your existing resume data!");
  };

  // AI Suggestion Handler
  const handleRequestAIImprovement = async (
    type: "summary" | "experience" | "skills" | "projects",
    context: any
  ) => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/resume/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: type, context }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "AI generation failed");

      let originalText = "";
      if (type === "summary") originalText = resumeData.summary;
      else if (type === "experience") originalText = context?.detail || context?.role || "";
      else if (type === "projects") originalText = context?.detail || context?.name || "";
      else if (type === "skills") originalText = resumeData.skills.join(", ");

      setAiDiffContext({
        section: type,
        itemId: context?.id,
        original: originalText,
        suggested: data.suggestion,
      });
      setAiDiffModalOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate AI suggestion");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveToBackend = async () => {
    setSaving(true);
    try {
      const payload = {
        full_name: resumeData.fullName,
        headline: resumeData.headline,
        email: resumeData.email,
        phone: resumeData.phone,
        location: resumeData.location,
        summary: resumeData.summary,
        education: resumeData.education,
        experience: resumeData.experience,
        projects: resumeData.projects,
        skills: resumeData.skills,
        publications: resumeData.publications,
        certifications: resumeData.certifications,
      };

      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.success) {
        toast.success(`Resume saved! ATS Match Score: ${result.ats_score || 85}/100`);
      } else {
        toast.error(result.error || "Failed to save to cloud; saved locally.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save resume; saved locally.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentTemplateName =
    TEMPLATE_OPTIONS.find((t) => t.id === styleConfig.templateId)?.name || "Modern Professional";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 flex flex-col font-sans print:bg-white print:min-h-0 print:p-0">
      {/* ═══ TOP ACTION TOOLBAR ═══ */}
      <header className="h-14 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 print:hidden">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm font-black text-xs">
              CV
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-900 leading-tight">
                Resume Studio
              </h1>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Precision Resume Studio & Career Document Engine
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
            <button
              onClick={() => setMyResumesOpen(true)}
              className="text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" /> My Resumes ({savedResumes.length})
            </button>
            <button
              onClick={() => setTemplateModalOpen(true)}
              className="text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
            >
              <LayoutTemplate className="w-3.5 h-3.5" /> Template: {currentTemplateName}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Mobile Editor/Preview Toggle */}
          <div className="lg:hidden flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setMobileMode("editor")}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                mobileMode === "editor" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setMobileMode("preview")}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                mobileMode === "preview" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
              }`}
            >
              Preview
            </button>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/70 px-3 py-2 rounded-xl transition"
            title="Import existing resume (.pdf, .docx, .txt)"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5 text-blue-600" />}
            <span>{uploading ? "Parsing..." : "Upload / Auto-Fill"}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,.doc"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />

          <button
            onClick={handleSaveToBackend}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition shadow-sm"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-slate-600" />}
            <span className="hidden sm:inline">{saving ? "Saving..." : "Save Draft"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </header>

      {/* ═══ 2-PANEL WORKSPACE ═══ */}
      <div className="flex-1 flex overflow-hidden min-h-0 print:block print:overflow-visible">
        {/* LEFT PANE: Editor Console (50%) */}
        <div
          className={`w-full lg:w-1/2 flex flex-col border-r border-slate-200 bg-white overflow-hidden print:hidden ${
            mobileMode === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Top-Level Workspace Mode Switcher */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 text-xs shrink-0">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => {
                  setActiveTab("personal");
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  activeTab !== "styling" && activeTab !== "ai"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                1. Content
              </button>
              <button
                onClick={() => setActiveTab("styling")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  activeTab === "styling"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                2. Customize
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                  activeTab === "ai"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>3. AI Tools</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTemplateModalOpen(true)}
                className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>Templates</span>
              </button>
            </div>
          </div>

          {/* Section Navigation Tabs (When in Content Mode) */}
          {activeTab !== "styling" && activeTab !== "ai" && (
            <div className="flex items-center gap-1 overflow-x-auto p-2 border-b border-slate-100 bg-slate-50/70 text-xs shrink-0">
              {[
                { id: "personal", label: "Personal", icon: User },
                { id: "experience", label: "Experience", icon: Briefcase },
                { id: "education", label: "Education", icon: GraduationCap },
                { id: "skills", label: "Skills", icon: Code },
                { id: "projects", label: "Projects", icon: FolderGit2 },
                { id: "extras", label: "Publications & Extras", icon: Award },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveEditorTab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                      isActive
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Form Content Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* TAB: Personal */}
            {activeTab === "personal" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Personal Information</h3>
                  <button
                    onClick={() => setTemplateModalOpen(true)}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Change Template ({currentTemplateName})
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      value={resumeData.fullName}
                      onChange={(e) => setResumeData({ ...resumeData, fullName: e.target.value })}
                      placeholder="e.g. Amit Kumar"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Professional Headline</label>
                    <input
                      type="text"
                      value={resumeData.headline}
                      onChange={(e) => setResumeData({ ...resumeData, headline: e.target.value })}
                      placeholder="e.g. ASIC & RTL Design Engineer | MS in Microelectronics"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email</label>
                      <input
                        type="email"
                        value={resumeData.email}
                        onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                        placeholder="e.g. amit@example.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone</label>
                      <input
                        type="text"
                        value={resumeData.phone}
                        onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Location</label>
                      <input
                        type="text"
                        value={resumeData.location}
                        onChange={(e) => setResumeData({ ...resumeData, location: e.target.value })}
                        placeholder="e.g. Bengaluru, India"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">LinkedIn</label>
                      <input
                        type="text"
                        value={resumeData.linkedin}
                        onChange={(e) => setResumeData({ ...resumeData, linkedin: e.target.value })}
                        placeholder="linkedin.com/in/..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">GitHub</label>
                      <input
                        type="text"
                        value={resumeData.github}
                        onChange={(e) => setResumeData({ ...resumeData, github: e.target.value })}
                        placeholder="github.com/..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Professional Summary
                      </label>
                      <button
                        onClick={() =>
                          handleRequestAIImprovement("summary", {
                            name: resumeData.fullName,
                            headline: resumeData.headline,
                            skills: resumeData.skills,
                            location: resumeData.location,
                          })
                        }
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> AI Polish
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={resumeData.summary}
                      onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                      placeholder="Write a concise 2-4 sentence summary of your semiconductor experience, core strengths, and engineering passion..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-none font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Experience */}
            {activeTab === "experience" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Work &amp; Internship Experience</h3>
                  <button
                    onClick={() =>
                      setResumeData({
                        ...resumeData,
                        experience: [
                          ...resumeData.experience,
                          { id: `exp-${Date.now()}`, role: "", org: "", period: "", detail: "" },
                        ],
                      })
                    }
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Experience
                  </button>
                </div>

                <div className="space-y-4">
                  {resumeData.experience.map((exp, i) => (
                    <div key={exp.id || i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                      <button
                        onClick={() =>
                          setResumeData({
                            ...resumeData,
                            experience: resumeData.experience.filter((_, idx) => idx !== i),
                          })
                        }
                        className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition p-1"
                        aria-label="Remove experience entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Job Title / Role</label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => {
                              const updated = [...resumeData.experience];
                              updated[i].role = e.target.value;
                              setResumeData({ ...resumeData, experience: updated });
                            }}
                            placeholder="e.g. RTL Design Engineer"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Company / Organization</label>
                          <input
                            type="text"
                            value={exp.org}
                            onChange={(e) => {
                              const updated = [...resumeData.experience];
                              updated[i].org = e.target.value;
                              setResumeData({ ...resumeData, experience: updated });
                            }}
                            placeholder="e.g. Qualcomm / C-DAC"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Employment Period</label>
                        <input
                          type="text"
                          value={exp.period}
                          onChange={(e) => {
                            const updated = [...resumeData.experience];
                            updated[i].period = e.target.value;
                            setResumeData({ ...resumeData, experience: updated });
                          }}
                          placeholder="e.g. Jul 2023 - Present"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-600">Responsibilities &amp; Achievements</label>
                          <button
                            type="button"
                            onClick={() =>
                              handleRequestAIImprovement("experience", {
                                id: exp.id,
                                role: exp.role,
                                org: exp.org,
                                detail: exp.detail,
                              })
                            }
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" /> AI Bullet Polish
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={exp.detail}
                          onChange={(e) => {
                            const updated = [...resumeData.experience];
                            updated[i].detail = e.target.value;
                            setResumeData({ ...resumeData, experience: updated });
                          }}
                          placeholder="• Architected FSM controller for memory interface...\n• Closed STA timing on 28nm node..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Education */}
            {activeTab === "education" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Education &amp; Qualifications</h3>
                  <button
                    onClick={() =>
                      setResumeData({
                        ...resumeData,
                        education: [
                          ...resumeData.education,
                          { id: `edu-${Date.now()}`, school: "", degree: "", year: "", cgpa: "" },
                        ],
                      })
                    }
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Education
                  </button>
                </div>

                <div className="space-y-4">
                  {resumeData.education.map((edu, i) => (
                    <div key={edu.id || i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                      <button
                        onClick={() =>
                          setResumeData({
                            ...resumeData,
                            education: resumeData.education.filter((_, idx) => idx !== i),
                          })
                        }
                        className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition p-1"
                        aria-label="Remove education entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="pr-8">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">School / University</label>
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => {
                            const updated = [...resumeData.education];
                            updated[i].school = e.target.value;
                            setResumeData({ ...resumeData, education: updated });
                          }}
                          placeholder="e.g. Indian Institute of Technology (IIT)"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Degree / Branch</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => {
                              const updated = [...resumeData.education];
                              updated[i].degree = e.target.value;
                              setResumeData({ ...resumeData, education: updated });
                            }}
                            placeholder="e.g. B.Tech in Electronics & Communication"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Year / Period</label>
                          <input
                            type="text"
                            value={edu.year}
                            onChange={(e) => {
                              const updated = [...resumeData.education];
                              updated[i].year = e.target.value;
                              setResumeData({ ...resumeData, education: updated });
                            }}
                            placeholder="e.g. 2020 - 2024"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Skills */}
            {activeTab === "skills" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Technical Skills &amp; EDA Tools</h3>
                  <span className="text-xs text-slate-500">{resumeData.skills.length} skills added</span>
                </div>

                {/* Tag Cloud */}
                <div className="flex flex-wrap gap-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl min-h-[80px]">
                  {resumeData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl shadow-2xs"
                    >
                      {skill}
                      <button
                        onClick={() =>
                          setResumeData({
                            ...resumeData,
                            skills: resumeData.skills.filter((s) => s !== skill),
                          })
                        }
                        className="text-slate-400 hover:text-red-600"
                        aria-label={`Remove skill ${skill}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Skill Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = skillInput.trim();
                        if (val && !resumeData.skills.includes(val)) {
                          setResumeData({ ...resumeData, skills: [...resumeData.skills, val] });
                        }
                        setSkillInput("");
                      }
                    }}
                    placeholder="Type skill (e.g. SystemVerilog, UVM, Innovus, Vivado) and press Enter"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <button
                    onClick={() => {
                      const val = skillInput.trim();
                      if (val && !resumeData.skills.includes(val)) {
                        setResumeData({ ...resumeData, skills: [...resumeData.skills, val] });
                      }
                      setSkillInput("");
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Projects */}
            {activeTab === "projects" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Technical &amp; Silicon Projects</h3>
                  <button
                    onClick={() =>
                      setResumeData({
                        ...resumeData,
                        projects: [
                          ...resumeData.projects,
                          { id: `proj-${Date.now()}`, name: "", technologies: "", detail: "" },
                        ],
                      })
                    }
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </div>

                <div className="space-y-4">
                  {resumeData.projects.map((proj, i) => (
                    <div key={proj.id || i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                      <button
                        onClick={() =>
                          setResumeData({
                            ...resumeData,
                            projects: resumeData.projects.filter((_, idx) => idx !== i),
                          })
                        }
                        className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition p-1"
                        aria-label="Remove project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Project Name</label>
                          <input
                            type="text"
                            value={proj.name}
                            onChange={(e) => {
                              const updated = [...resumeData.projects];
                              updated[i].name = e.target.value;
                              setResumeData({ ...resumeData, projects: updated });
                            }}
                            placeholder="e.g. RISC-V RV32I Processor"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Technologies / EDA Tools</label>
                          <input
                            type="text"
                            value={proj.technologies || ""}
                            onChange={(e) => {
                              const updated = [...resumeData.projects];
                              updated[i].technologies = e.target.value;
                              setResumeData({ ...resumeData, projects: updated });
                            }}
                            placeholder="e.g. Verilog, Vivado, ModelSim"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-600">Description &amp; Outcomes</label>
                          <button
                            type="button"
                            onClick={() =>
                              handleRequestAIImprovement("projects", {
                                id: proj.id,
                                name: proj.name,
                                technologies: proj.technologies,
                                detail: proj.detail,
                              })
                            }
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" /> AI Project Polish
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={proj.detail}
                          onChange={(e) => {
                            const updated = [...resumeData.projects];
                            updated[i].detail = e.target.value;
                            setResumeData({ ...resumeData, projects: updated });
                          }}
                          placeholder="Explain architecture, testbench methodology, coverage, and results..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Extras (Certifications & Publications) */}
            {activeTab === "extras" && (
              <div className="space-y-6">
                {/* Certifications */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">Certifications</h3>
                    <button
                      onClick={() =>
                        setResumeData({
                          ...resumeData,
                          certifications: [
                            ...resumeData.certifications,
                            { id: `cert-${Date.now()}`, name: "", year: "" },
                          ],
                        })
                      }
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                  {resumeData.certifications.map((c, i) => (
                    <div key={c.id || i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => {
                          const updated = [...resumeData.certifications];
                          updated[i].name = e.target.value;
                          setResumeData({ ...resumeData, certifications: updated });
                        }}
                        placeholder="e.g. Certified ASIC Verification Engineer"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                      />
                      <input
                        type="text"
                        value={c.year || ""}
                        onChange={(e) => {
                          const updated = [...resumeData.certifications];
                          updated[i].year = e.target.value;
                          setResumeData({ ...resumeData, certifications: updated });
                        }}
                        placeholder="Year"
                        className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                      />
                      <button
                        onClick={() =>
                          setResumeData({
                            ...resumeData,
                            certifications: resumeData.certifications.filter((_, idx) => idx !== i),
                          })
                        }
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Publications */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">Publications &amp; Papers</h3>
                    <button
                      onClick={() =>
                        setResumeData({
                          ...resumeData,
                          publications: [
                            ...resumeData.publications,
                            { id: `pub-${Date.now()}`, title: "", venue: "", year: "" },
                          ],
                        })
                      }
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                  {resumeData.publications.map((p, i) => (
                    <div key={p.id || i} className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl relative">
                      <button
                        onClick={() =>
                          setResumeData({
                            ...resumeData,
                            publications: resumeData.publications.filter((_, idx) => idx !== i),
                          })
                        }
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        value={p.title}
                        onChange={(e) => {
                          const updated = [...resumeData.publications];
                          updated[i].title = e.target.value;
                          setResumeData({ ...resumeData, publications: updated });
                        }}
                        placeholder="Paper / Publication Title"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={p.venue || ""}
                          onChange={(e) => {
                            const updated = [...resumeData.publications];
                            updated[i].venue = e.target.value;
                            setResumeData({ ...resumeData, publications: updated });
                          }}
                          placeholder="Journal / Conference"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                        />
                        <input
                          type="text"
                          value={p.year || ""}
                          onChange={(e) => {
                            const updated = [...resumeData.publications];
                            updated[i].year = e.target.value;
                            setResumeData({ ...resumeData, publications: updated });
                          }}
                          placeholder="Year"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Styling Customizer */}
            {activeTab === "styling" && (
              <StyleCustomizer style={styleConfig} onChange={setStyleConfig} />
            )}

            {/* TAB: AI ATS Advisor */}
            {activeTab === "ai" && (
              <AIResumeAdvisor
                data={resumeData}
                targetRole={targetRole}
                onTargetRoleChange={setTargetRole}
                onRequestImprovement={handleRequestAIImprovement}
                isAiLoading={aiLoading}
              />
            )}
          </div>
        </div>

        {/* RIGHT PANE: Live A4 Preview (50%) */}
        <div
          className={`w-full lg:w-1/2 bg-slate-200/80 p-4 sm:p-6 overflow-y-auto flex flex-col items-center justify-start relative print:w-full print:p-0 print:bg-white ${
            mobileMode === "editor" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Zoom Controls Bar */}
          <div className="sticky top-2 z-10 bg-white/90 backdrop-blur-sm border border-slate-300 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-3 text-xs mb-4 print:hidden">
            <span className="font-bold text-slate-700">Preview: {currentTemplateName}</span>
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
              <button
                onClick={() => setZoomScale((prev) => Math.max(0.6, prev - 0.1))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Zoom Out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-slate-600 w-10 text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((prev) => Math.min(1.3, prev + 0.1))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Zoom In"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Master Printable Resume Canvas */}
          <div className="w-full flex justify-center print:w-full">
            <ResumePreview
              ref={previewContainerRef}
              data={resumeData}
              style={styleConfig}
              scale={zoomScale}
            />
          </div>
        </div>
      </div>

      {/* ═══ MODALS & DRAWERS ═══ */}
      {/* 1. Template Selector Gallery */}
      <TemplateSelector
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        selectedTemplateId={styleConfig.templateId}
        onSelectTemplate={(id) => setStyleConfig({ ...styleConfig, templateId: id })}
      />

      {/* 2. My Resumes Drawer */}
      <MyResumesDrawer
        isOpen={myResumesOpen}
        onClose={() => setMyResumesOpen(false)}
        resumes={savedResumes}
        activeResumeId={activeResumeId}
        onSelectResume={(id) => {
          if (id === activeResumeId) return;
          try {
            const storedMap = localStorage.getItem("bdw_resume_versions_map_v1");
            if (storedMap) {
              const parsedMap = JSON.parse(storedMap);
              if (parsedMap[id]) {
                if (parsedMap[id].data) setResumeData(parsedMap[id].data);
                if (parsedMap[id].style) setStyleConfig(parsedMap[id].style);
              }
            }
          } catch {}
          setActiveResumeId(id);
          toast.success("Switched active resume version");
        }}
        onCreateNew={() => {
          const newId = `resume-${Date.now()}`;
          const newResume: SavedResumeMeta = {
            id: newId,
            name: `Resume Version ${savedResumes.length + 1}`,
            templateId: styleConfig.templateId,
            updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          const newVersion = { data: DEFAULT_RESUME_DATA, style: styleConfig };
          try {
            const storedMap = localStorage.getItem("bdw_resume_versions_map_v1");
            const parsedMap = storedMap ? JSON.parse(storedMap) : {};
            parsedMap[newId] = newVersion;
            localStorage.setItem("bdw_resume_versions_map_v1", JSON.stringify(parsedMap));
          } catch {}
          setSavedResumes([...savedResumes, newResume]);
          setActiveResumeId(newId);
          setResumeData(DEFAULT_RESUME_DATA);
          toast.success("Created new resume version!");
        }}
        onDuplicate={(id) => {
          const original = savedResumes.find((r) => r.id === id);
          if (!original) return;
          const cloneId = `resume-${Date.now()}`;
          const clonedMeta: SavedResumeMeta = {
            id: cloneId,
            name: `${original.name} (Copy)`,
            templateId: original.templateId,
            updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          try {
            const storedMap = localStorage.getItem("bdw_resume_versions_map_v1");
            const parsedMap = storedMap ? JSON.parse(storedMap) : {};
            const sourceVersion = parsedMap[id] || { data: resumeData, style: styleConfig };
            parsedMap[cloneId] = JSON.parse(JSON.stringify(sourceVersion));
            localStorage.setItem("bdw_resume_versions_map_v1", JSON.stringify(parsedMap));
          } catch {}
          setSavedResumes([...savedResumes, clonedMeta]);
          toast.success("Duplicated resume version!");
        }}
        onRename={(id, newName) => {
          setSavedResumes((prev) =>
            prev.map((r) => (r.id === id ? { ...r, name: newName } : r))
          );
        }}
        onDelete={(id) => {
          if (savedResumes.length <= 1) return;
          const remaining = savedResumes.filter((r) => r.id !== id);
          setSavedResumes(remaining);
          try {
            const storedMap = localStorage.getItem("bdw_resume_versions_map_v1");
            if (storedMap) {
              const parsedMap = JSON.parse(storedMap);
              delete parsedMap[id];
              localStorage.setItem("bdw_resume_versions_map_v1", JSON.stringify(parsedMap));
            }
          } catch {}
          if (activeResumeId === id) {
            const fallbackId = remaining[0].id;
            setActiveResumeId(fallbackId);
            try {
              const storedMap = localStorage.getItem("bdw_resume_versions_map_v1");
              if (storedMap) {
                const parsedMap = JSON.parse(storedMap);
                if (parsedMap[fallbackId]) {
                  if (parsedMap[fallbackId].data) setResumeData(parsedMap[fallbackId].data);
                  if (parsedMap[fallbackId].style) setStyleConfig(parsedMap[fallbackId].style);
                }
              }
            } catch {}
          }
          toast.success("Deleted resume version");
        }}
      />

      {/* 3. Import Review Modal */}
      {parsedDataForReview && (
        <ImportReviewModal
          isOpen={importReviewOpen}
          onClose={() => setImportReviewOpen(false)}
          parsedData={parsedDataForReview}
          onApplyAll={handleApplyAllExtracted}
          onMerge={handleMergeExtracted}
        />
      )}

      {/* 4. AI Improvement Side-by-Side Diff Modal */}
      <AIImproveDiffModal
        isOpen={aiDiffModalOpen}
        onClose={() => setAiDiffModalOpen(false)}
        sectionType={aiDiffContext.section}
        originalText={aiDiffContext.original}
        suggestedText={aiDiffContext.suggested}
        onAccept={(accepted) => {
          if (aiDiffContext.section === "summary") {
            setResumeData((prev) => ({ ...prev, summary: accepted }));
            toast.success("Updated professional summary!");
          } else if (aiDiffContext.section === "experience" && aiDiffContext.itemId) {
            setResumeData((prev) => ({
              ...prev,
              experience: prev.experience.map((exp) =>
                exp.id === aiDiffContext.itemId ? { ...exp, detail: accepted } : exp
              ),
            }));
            toast.success("Updated experience bullet points!");
          } else if (aiDiffContext.section === "projects" && aiDiffContext.itemId) {
            setResumeData((prev) => ({
              ...prev,
              projects: prev.projects.map((proj) =>
                proj.id === aiDiffContext.itemId ? { ...proj, detail: accepted } : proj
              ),
            }));
            toast.success("Updated project details!");
          } else if (aiDiffContext.section === "skills") {
            const newSkills = accepted
              .split(/[,•\n]/)
              .map((s) => s.trim())
              .filter(Boolean);
            setResumeData((prev) => ({
              ...prev,
              skills: Array.from(new Set([...prev.skills, ...newSkills])),
            }));
            toast.success("Updated technical skills!");
          }
          setAiDiffModalOpen(false);
        }}
      />
    </div>
  );
}