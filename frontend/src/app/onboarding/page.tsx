"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Briefcase,
  Building2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Layers,
  MapPin,
  Globe,
  Cpu,
  ShieldCheck,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

type PrimaryIntent = "candidate" | "employer" | "both";

const TARGET_DOMAINS = [
  "VLSI ASIC Design",
  "FPGA & Digital Design",
  "Embedded Systems & Firmware",
  "Analog & Mixed Signal Layout",
  "RTL & UVM Verification",
  "Semiconductor Fabrication & Physics",
  "PCB Design & Hardware QA",
  "Robotics & Control Systems",
];

const EDUCATION_LEVELS = [
  "B.Tech / B.E. in ECE/EEE/CS",
  "M.Tech / M.E. in VLSI/MicroElectronics",
  "Ph.D. in Semiconductor / Hardware",
  "B.Sc / M.Sc in Electronics / Physics",
  "Diploma in Electronics",
  "Self-Taught / Other",
];

const EXPERIENCE_LEVELS = [
  "Fresher / Student (0 years)",
  "Junior Engineer (1–3 years)",
  "Mid-Level Engineer (3–5 years)",
  "Senior Engineer / Lead (5+ years)",
];

const ORG_TYPES = [
  "Semiconductor Enterprise / MNC",
  "Fabless VLSI Startup",
  "Govt Research Lab (DRDO / ISRO / CSIR)",
  "Academic / University Lab",
  "Hardware Service / Consultancy",
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [intent, setIntent] = useState<PrimaryIntent>("candidate");

  // Candidate fields
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [educationLevel, setEducationLevel] = useState(EDUCATION_LEVELS[0]);
  const [experienceLevel, setExperienceLevel] = useState(EXPERIENCE_LEVELS[0]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([
    TARGET_DOMAINS[0],
    TARGET_DOMAINS[1],
  ]);
  const [skills, setSkills] = useState("Verilog, SystemVerilog, RTL Design, ModelSim");

  // Employer fields
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState(ORG_TYPES[0]);
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgIndustry, setOrgIndustry] = useState("Semiconductors");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirectTo=/onboarding");
      return;
    }

    const meta = user.user_metadata || {};
    const initialRole = meta.role || meta.account_type;
    if (initialRole === "employer" || initialRole === "provider") {
      setIntent("employer");
    } else {
      setIntent("candidate");
    }

    setDisplayName(meta.full_name || user.email?.split("@")[0] || "");
    setOrgName(meta.org_name || "");
    setReady(true);
  }, [user, authLoading, router]);

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // Determine updated account_type
      const updatedAccountType =
        intent === "employer" ? "employer" : intent === "both" ? "both" : "candidate";

      // 1. Update user profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          display_name: displayName.trim() || user.email?.split("@")[0],
          headline: headline.trim() || (intent === "employer" ? `Recruiter at ${orgName}` : "Hardware & VLSI Enthusiast"),
          location: location.trim() || "India",
          account_type: updatedAccountType,
          skills: skillsArray,
          metadata: {
            education_level: educationLevel,
            experience_level: experienceLevel,
            target_domains: selectedDomains,
            primary_intent: intent,
            onboarded_at: new Date().toISOString(),
          },
        })
        .eq("id", user.id);

      if (profileError) {
        console.warn("Profile update notice:", profileError.message);
      }

      // 2. If Employer or Both, create/link Organization if specified
      if ((intent === "employer" || intent === "both") && orgName.trim()) {
        const orgSlug = `${slugify(orgName)}-${Date.now().toString(36)}`;
        await supabase.from("organizations").insert({
          name: orgName.trim(),
          slug: orgSlug,
          kind: "company",
          website: orgWebsite.trim() || null,
          created_by: user.id,
        });
      }

      // 3. Sync metadata in Supabase Auth user
      await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim(),
          role: intent === "employer" || intent === "both" ? "employer" : "candidate",
          primary_intent: intent,
          onboarding_completed: true,
        },
      });

      toast.success("Welcome aboard! Your capabilities are now active.");
      router.replace(intent === "employer" ? "/employer/dashboard" : "/dashboard");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Welcome to BerojgarDegreeWala
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Customize Your Career Platform Experience
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Tell us your primary intent today. You can always activate additional capabilities anytime without creating a new account.
          </p>
        </div>

        {/* INTENT SELECTOR CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* OPTION 1: CANDIDATE */}
          <button
            type="button"
            onClick={() => setIntent("candidate")}
            className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
              intent === "candidate"
                ? "border-blue-600 bg-white shadow-md ring-2 ring-blue-500/20"
                : "border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white"
            }`}
          >
            {intent === "candidate" && (
              <CheckCircle2 className="w-5 h-5 text-blue-600 absolute top-4 right-4" />
            )}
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3 text-blue-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Looking for Opportunities</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Discover VLSI, JRF, Embedded, and Govt Tech roles with AI Resume Studio.
            </p>
          </button>

          {/* OPTION 2: EMPLOYER */}
          <button
            type="button"
            onClick={() => setIntent("employer")}
            className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
              intent === "employer"
                ? "border-blue-600 bg-white shadow-md ring-2 ring-blue-500/20"
                : "border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white"
            }`}
          >
            {intent === "employer" && (
              <CheckCircle2 className="w-5 h-5 text-blue-600 absolute top-4 right-4" />
            )}
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3 text-emerald-600">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Hiring Talent</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Post semiconductor openings, source engineers, and manage ATS applicants.
            </p>
          </button>

          {/* OPTION 3: BOTH */}
          <button
            type="button"
            onClick={() => setIntent("both")}
            className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
              intent === "both"
                ? "border-blue-600 bg-white shadow-md ring-2 ring-blue-500/20"
                : "border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white"
            }`}
          >
            {intent === "both" && (
              <CheckCircle2 className="w-5 h-5 text-blue-600 absolute top-4 right-4" />
            )}
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3 text-purple-600">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Both (Unified)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Full access to browse opportunities, network, and hire under one account.
            </p>
          </button>
        </div>

        {/* PROGRESSIVE ONBOARDING FORM */}
        <Card className="p-6 sm:p-8 bg-white border border-slate-200 shadow-sm rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SHARED SECTION */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" /> Essential Identity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Full Name / Display Name
                  </label>
                  <Input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location (City / State)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <Input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Bengaluru, Karnataka"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CANDIDATE / BOTH FIELDS */}
            {(intent === "candidate" || intent === "both") && (
              <div className="space-y-4 pt-2">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" /> Career Profile & Target Domains
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Professional Headline
                  </label>
                  <Input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. RTL Design & Verification Engineer | SystemVerilog | RISC-V"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Highest Education Level
                    </label>
                    <Select
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                    >
                      {EDUCATION_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Experience Level
                    </label>
                    <Select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                    >
                      {EXPERIENCE_LEVELS.map((exp) => (
                        <option key={exp} value={exp}>
                          {exp}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Domains (Click to select multiple)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TARGET_DOMAINS.map((domain) => {
                      const active = selectedDomains.includes(domain);
                      return (
                        <button
                          key={domain}
                          type="button"
                          onClick={() => toggleDomain(domain)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            active
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {domain}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Key Technical Skills (Comma-separated)
                  </label>
                  <Input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. Verilog, SystemVerilog, UVM, STA, Cadence Virtuoso, C++"
                  />
                </div>
              </div>
            )}

            {/* EMPLOYER / BOTH FIELDS */}
            {(intent === "employer" || intent === "both") && (
              <div className="space-y-4 pt-2">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Building2 className="w-5 h-5 text-emerald-600" /> Organization & Hiring Workspace
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Organization / Company Name
                    </label>
                    <Input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Silicon Labs India / ISRO SAC"
                      required={intent === "employer"}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Organization Type
                    </label>
                    <Select value={orgType} onChange={(e) => setOrgType(e.target.value)}>
                      {ORG_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Website
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <Input
                        type="url"
                        value={orgWebsite}
                        onChange={(e) => setOrgWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Industry Domain
                    </label>
                    <Input
                      type="text"
                      value={orgIndustry}
                      onChange={(e) => setOrgIndustry(e.target.value)}
                      placeholder="e.g. Semiconductor IP / VLSI Services"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Capabilities...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Setup & Enter Platform</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}