"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Pencil, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Globe, 
  Linkedin, 
  Github, 
  CheckCircle2, 
  Plus, 
  X, 
  Sparkles,
  User,
  Share2,
  Camera,
  Check
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import EditProfileModal from "@/components/profile/EditProfileModal";

interface Profile {
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
  experience_years?: number | null;
  is_open_to_work?: boolean;
  avatar_url?: string | null;
  skills?: string[];
  account_type?: string;
}

function initials(name?: string): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function LinkedInStyleProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [profile, setProfile] = useState<Profile>({});
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirectTo=/profile");
      return;
    }

    let cancelled = false;

    api
      .get<Profile>("/api/profile/" + user.id)
      .then((existing) => {
        if (cancelled) return;
        // Profile already set up -> canonical public URL is the destination.
        // This page remains the setup/editor for users without a row yet.
        if (existing?.username) {
          router.replace(`/profile/${existing.username}`);
          return;
        }
        setProfile(existing);
        setSkills(existing.skills || ["SystemVerilog", "UVM", "RTL Synthesis", "OpenLANE", "FPGA"]);
      })
      .catch(() => {
        if (cancelled) return;
        const defaultProfile: Profile = {
          display_name: user.user_metadata?.full_name || "Hardware Engineer",
          username: (user.email || "").split("@")[0] || "vlsi_dev",
          headline: "Hardware & VLSI Design Engineer | Open for Opportunities",
          location: "Bengaluru, Karnataka, India",
          is_open_to_work: true,
        };
        setProfile(defaultProfile);
        setSkills(["SystemVerilog", "UVM", "RTL Synthesis", "OpenLANE", "FPGA"]);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) {
      const updated = [...skills, s];
      setSkills(updated);
      setNewSkill("");
      if (user) {
        fetch(`/api/profile/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skills: updated }),
        });
      }
    }
  };

  const removeSkill = (s: string) => {
    const updated = skills.filter((x) => x !== s);
    setSkills(updated);
    if (user) {
      fetch(`/api/profile/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: updated }),
      });
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center">
        <div className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_#0F172A]">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="font-black text-slate-900 text-sm">Loading Profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] text-slate-900 pb-16 font-sans">
      
      {/* LINKEDIN TOP NAV BREADCRUMB */}
      <div className="bg-white border-b border-slate-300 py-3 px-4 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-white font-black text-xs">
              BP
            </div>
            <span className="font-black text-sm text-slate-900">Professional Profile</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Canonical public URL, not the dashboard path.
                navigator.clipboard.writeText(
                  profile.username
                    ? `${window.location.origin}/profile/${profile.username}`
                    : window.location.href
                );
                toast.success("Profile link copied!");
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 rounded-xl text-xs font-black text-slate-900 shadow-[2px_2px_0px_0px_#0F172A] flex items-center gap-1.5 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Profile</span>
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border-2 border-slate-900 rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#0F172A] flex items-center gap-1.5 transition"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MAIN PROFILE COLUMN (LEFT 2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CARD 1: LINKEDIN HEADER & BANNER */}
          <div className="bg-white border-3 border-slate-900 rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_#0F172A] relative">
            
            {/* HARDWARE BANNER COVER */}
            <div className="h-40 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 relative p-4 flex justify-end items-start">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" /> VLSI Hardware Talent
              </span>
            </div>

            {/* AVATAR & QUICK ACTIONS */}
            <div className="px-6 pb-6 pt-0 relative">
              <div className="flex justify-between items-end -mt-16 mb-4">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-slate-900 text-white font-black text-3xl flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                    ) : (
                      initials(profile.display_name)
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute bottom-1 right-1 p-1.5 bg-blue-600 text-white rounded-full border-2 border-white shadow hover:scale-105 transition"
                    title="Change Photo / Edit"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 rounded-xl text-slate-900 shadow-[2px_2px_0px_0px_#0F172A] transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* NAME & HANDLE */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">{profile.display_name || "Hardware Engineer"}</h1>
                  <span className="px-2 py-0.5 bg-blue-100 border border-blue-600 rounded text-[11px] font-black text-blue-900">
                    @{profile.username || "username"}
                  </span>
                </div>

                <p className="text-sm font-bold text-slate-700 leading-snug">
                  {profile.headline || "VLSI ASIC & FPGA Hardware Design Engineer | RISC-V Enthusiast"}
                </p>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-semibold text-slate-500">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {profile.location}
                    </span>
                  )}
                  {profile.current_company && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {profile.job_title || "Engineer"} at {profile.current_company}
                    </span>
                  )}
                </div>

                {/* OPEN TO WORK BADGE */}
                {profile.is_open_to_work !== false && (
                  <div className="mt-3 p-3 bg-emerald-50 border-2 border-emerald-600 rounded-xl flex items-center gap-3">
                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-emerald-900">Open to Work</span>
                      <span className="text-[11px] font-bold text-emerald-700">Available for VLSI, RTL Design, FPGA, & JRF Research roles</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* CARD 2: ABOUT SECTION */}
          <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#0F172A] space-y-3">
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">About / Summary</h2>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
              {profile.bio ||
                "Passionate semiconductor professional specializing in SystemVerilog, UVM verification, and digital ASIC design. Experienced with EDA synthesis tools, OpenLANE, and RISC-V SoC architecture."}
            </p>
          </div>

          {/* CARD 3: HARDWARE SKILLS */}
          <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#0F172A] space-y-4">
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Skills & Endorsements</h2>
              <span className="text-xs font-bold text-slate-500">{skills.length} Skills Listed</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {skills.map((sk) => (
                <span
                  key={sk}
                  className="px-3 py-1.5 bg-slate-100 border-2 border-slate-900 rounded-xl text-xs font-black text-slate-900 shadow-[2px_2px_0px_0px_#0F172A] flex items-center gap-2"
                >
                  {sk}
                  <button onClick={() => removeSkill(sk)} className="hover:text-red-600 transition">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* ADD NEW SKILL INPUT */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Add hardware skill (e.g. Verilog, Cadence Virtuoso, STA)..."
                className="flex-1 px-4 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-[2px_2px_0px_0px_#0F172A] focus:outline-none"
              />
              <button
                onClick={addSkill}
                type="button"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_#0F172A] flex items-center gap-1 transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Add
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT SIDEBAR COLUMN */}
        <div className="space-y-6">
          
          {/* PUBLIC LINKS CARD */}
          <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#0F172A] space-y-4">
            <h3 className="text-base font-black text-slate-900 border-b-2 border-slate-900 pb-2">Contact & Portfolio Links</h3>
            
            <div className="space-y-3">
              {profile.linkedin_url ? (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-2.5 bg-blue-50 border-2 border-slate-900 rounded-xl text-xs font-black text-blue-900 shadow-[2px_2px_0px_0px_#0F172A] hover:bg-blue-100 transition"
                >
                  <Linkedin className="w-4 h-4 text-blue-600" /> LinkedIn Profile
                </a>
              ) : (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full text-left p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:border-slate-900 transition flex items-center gap-2"
                >
                  <Linkedin className="w-4 h-4" /> Add LinkedIn URL
                </button>
              )}

              {profile.github_url ? (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-2.5 bg-slate-100 border-2 border-slate-900 rounded-xl text-xs font-black text-slate-900 shadow-[2px_2px_0px_0px_#0F172A] hover:bg-slate-200 transition"
                >
                  <Github className="w-4 h-4 text-slate-900" /> GitHub Repositories
                </a>
              ) : (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full text-left p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:border-slate-900 transition flex items-center gap-2"
                >
                  <Github className="w-4 h-4" /> Add GitHub URL
                </button>
              )}

              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-2.5 bg-emerald-50 border-2 border-slate-900 rounded-xl text-xs font-black text-emerald-900 shadow-[2px_2px_0px_0px_#0F172A] hover:bg-emerald-100 transition"
                >
                  <Globe className="w-4 h-4 text-emerald-600" /> Personal Website
                </a>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* LINKEDIN EDIT PROFILE MODAL */}
      {isEditModalOpen && user && (
        <EditProfileModal
          userId={user.id}
          profile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={(updated) => {
            setProfile(updated as Profile);
            setSkills(updated.skills || []);
            setIsEditModalOpen(false);
          }}
        />
      )}

    </div>
  );
}
