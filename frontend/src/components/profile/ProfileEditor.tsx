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
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
    <div className="min-h-screen bg-bg-primary text-slate-900 pb-16">
      {/* TOP NAV BREADCRUMB */}
      <div className="bg-white border-b-2 border-slate-900 py-3 px-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-white font-black text-xs shadow-brutal-sm">
              BP
            </div>
            <span className="font-black text-sm text-slate-900">Professional Profile</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(
                  profile.username
                    ? `${window.location.origin}/profile/${profile.username}`
                    : window.location.href
                );
                toast.success("Profile link copied!");
              }}
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Profile
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN PROFILE COLUMN (LEFT 2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* CARD 1: PROFILE HEADER & BANNER */}
          <Card className="relative overflow-hidden">
            {/* COVER */}
            <div className="h-40 bg-blue-600 border-b-2 border-slate-900" />

            {/* AVATAR & QUICK ACTIONS */}
            <div className="px-6 pb-6 relative">
              <div className="flex justify-between items-end -mt-16 mb-4">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-slate-900 text-white font-black text-3xl flex items-center justify-center ring-4 ring-white shadow-brutal overflow-hidden">
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      initials(displayName)
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute bottom-1 right-1 p-1.5 bg-blue-600 text-white rounded-full border-2 border-slate-900 shadow-brutal-sm hover:scale-105 transition"
                    title="Change Photo / Edit"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
              </div>

              {/* NAME & HANDLE */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">{displayName}</h1>
                  {profile.username && (
                    <span className="px-2 py-0.5 bg-blue-100 border-2 border-blue-600 rounded-lg text-[11px] font-bold text-blue-900">
                      @{profile.username}
                    </span>
                  )}
                </div>

                {profile.headline && (
                  <p className="text-sm font-semibold text-slate-700 leading-snug">{profile.headline}</p>
                )}

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-medium text-slate-500">
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
                      <span className="text-[11px] font-medium text-emerald-700">Visible to recruiters on your public profile</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* CARD 2: ABOUT SECTION */}
          <Card className="p-6 space-y-3">
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">About / Summary</h2>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="p-1.5 h-auto"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">
              {profile.bio || "No bio added yet."}
            </p>
          </Card>

          {/* CARD 3: SKILLS */}
          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Skills & Endorsements</h2>
              <span className="text-xs font-bold text-slate-500">{skills.length} Skills Listed</span>
            </div>

            {skills.length === 0 && <p className="text-xs font-semibold text-slate-400">No skills added yet.</p>}

            <div className="flex flex-wrap gap-2">
              {skills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-semibold text-slate-900 shadow-brutal-sm"
                >
                  {sk}
                  <button onClick={() => removeSkill(sk)} className="hover:text-red-600 transition" aria-label={`Remove ${sk}`}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* ADD SKILL INPUT */}
            <div className="flex gap-2 pt-2">
              <div className="flex-1">
                <Input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="Add a skill (e.g. Verilog, STA, Python)..."
                />
              </div>
              <Button
                size="sm"
                type="button"
                onClick={addSkill}
                className="h-auto"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Add
              </Button>
            </div>
          </Card>
        </div>

        {/* RIGHT SIDEBAR COLUMN */}
        <div className="space-y-6">
          {/* PUBLIC LINKS CARD */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900 border-b-2 border-slate-900 pb-2">Contact & Portfolio Links</h3>

            <div className="space-y-3">
              {profile.linkedin_url ? (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-2.5 bg-blue-50 border-2 border-slate-900 rounded-xl text-xs font-bold text-blue-900 shadow-brutal-sm hover:bg-blue-100 transition"
                >
                  <Linkedin className="w-4 h-4 text-blue-600" /> LinkedIn Profile
                </a>
              ) : (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full text-left p-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-semibold text-slate-500 hover:border-slate-900 transition flex items-center gap-2"
                >
                  <Linkedin className="w-4 h-4" /> Add LinkedIn URL
                </button>
              )}

              {profile.github_url ? (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-2.5 bg-blue-50 border-2 border-slate-900 rounded-xl text-xs font-bold text-blue-900 shadow-brutal-sm hover:bg-blue-100 transition"
                >
                  <Github className="w-4 h-4 text-blue-600" /> GitHub Repositories
                </a>
              ) : (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full text-left p-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-semibold text-slate-500 hover:border-slate-900 transition flex items-center gap-2"
                >
                  <Github className="w-4 h-4" /> Add GitHub URL
                </button>
              )}

              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-2.5 bg-blue-50 border-2 border-slate-900 rounded-xl text-xs font-bold text-blue-900 shadow-brutal-sm hover:bg-blue-100 transition"
                >
                  <Globe className="w-4 h-4 text-blue-600" /> Personal Website
                </a>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
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