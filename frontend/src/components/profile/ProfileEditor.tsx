"use client";

// Own-profile setup/editor page content. Rendered by the /profile server
// component ONLY when the user has no username yet (otherwise the page
// redirects server-side). Receives real data as props — never fabricates
// placeholder bio/name/skills; empty fields render honest empty states.

import { useState } from "react";
import {
  Pencil,
  MapPin,
  Briefcase,
  Globe,
  Linkedin,
  Github,
  Plus,
  X,
  Share2,
  Camera,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import EditProfileModal from "@/components/profile/EditProfileModal";

export interface Profile {
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

interface Props {
  userId: string;
  initialProfile: Profile | null;
  authName?: string | null;
}

function initials(name?: string): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function ProfileEditor({ userId, initialProfile, authName }: Props) {
  const [profile, setProfile] = useState<Profile>(initialProfile || {});
  const [skills, setSkills] = useState<string[]>(initialProfile?.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const displayName = profile.display_name || authName || "Your Profile";

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) {
      const updated = [...skills, s];
      setSkills(updated);
      setNewSkill("");
      fetch(`/api/profile/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: updated }),
      });
    }
  };

  const removeSkill = (s: string) => {
    const updated = skills.filter((x) => x !== s);
    setSkills(updated);
    fetch(`/api/profile/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills: updated }),
    });
  };

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
            {/* COVER */}
            <div className="h-40 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900" />

            {/* AVATAR & QUICK ACTIONS */}
            <div className="px-6 pb-6 pt-0 relative">
              <div className="flex justify-between items-end -mt-16 mb-4">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-slate-900 text-white font-black text-3xl flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      initials(displayName)
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
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">{displayName}</h1>
                  {profile.username && (
                    <span className="px-2 py-0.5 bg-blue-100 border border-blue-600 rounded text-[11px] font-black text-blue-900">
                      @{profile.username}
                    </span>
                  )}
                </div>

                {profile.headline && (
                  <p className="text-sm font-bold text-slate-700 leading-snug">{profile.headline}</p>
                )}

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
                      {profile.job_title
                        ? `${profile.job_title} at ${profile.current_company}`
                        : profile.current_company}
                    </span>
                  )}
                </div>

                {/* OPEN TO WORK BADGE — only when the user explicitly enabled it */}
                {profile.is_open_to_work === true && (
                  <div className="mt-3 p-3 bg-emerald-50 border-2 border-emerald-600 rounded-xl flex items-center gap-3">
                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-emerald-900">Open to Work</span>
                      <span className="text-[11px] font-bold text-emerald-700">Visible to recruiters on your public profile</span>
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
              {profile.bio || "No bio added yet."}
            </p>
          </div>

          {/* CARD 3: SKILLS */}
          <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#0F172A] space-y-4">
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Skills & Endorsements</h2>
              <span className="text-xs font-bold text-slate-500">{skills.length} Skills Listed</span>
            </div>

            {skills.length === 0 && <p className="text-xs font-bold text-slate-400">No skills added yet.</p>}

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

            {/* ADD SKILL INPUT */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Add a skill (e.g. Verilog, STA, Python)..."
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
      {isEditModalOpen && (
        <EditProfileModal
          userId={userId}
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
