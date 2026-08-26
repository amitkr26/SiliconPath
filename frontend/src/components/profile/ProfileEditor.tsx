"use client";

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
  Users,
  BookOpen,
  Award,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

  // Calculate profile completeness
  const completenessItems = [
    { label: "Profile photo", done: !!profile.avatar_url },
    { label: "Headline", done: !!profile.headline },
    { label: "About summary", done: !!profile.bio },
    { label: "Location", done: !!profile.location },
    { label: "Skills", done: skills.length > 0 },
    { label: "Experience", done: false },
    { label: "Education", done: false },
  ];
  const completedCount = completenessItems.filter((i) => i.done).length;
  const completenessPercent = Math.round((completedCount / completenessItems.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Top Nav */}
      <div className="bg-white border-b border-gray-200 py-3 px-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">
              BP
            </div>
            <span className="font-semibold text-sm text-gray-900">Professional Profile</span>
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
        {/* Main Content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Cover */}
            <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-500" />

            {/* Avatar & Info */}
            <div className="px-6 pb-6 relative">
              <div className="flex justify-between items-end -mt-14 mb-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center text-2xl font-bold text-gray-700 overflow-hidden">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      initials(displayName)
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute bottom-0 right-0 p-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition"
                    title="Change Photo"
                  >
                    <Camera className="w-3.5 h-3.5 text-gray-600" />
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

              {/* Name & Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                  {profile.username && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      @{profile.username}
                    </span>
                  )}
                </div>

                {profile.headline && (
                  <p className="text-base text-gray-600">{profile.headline}</p>
                )}

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-gray-500">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </span>
                  )}
                  {profile.current_company && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {profile.job_title
                        ? `${profile.job_title} at ${profile.current_company}`
                        : profile.current_company}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    0 connections
                  </span>
                </div>

                {/* Open to Work Banner */}
                {profile.is_open_to_work === true && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <div className="p-1.5 bg-green-600 text-white rounded-md">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-green-900">Open to Work</span>
                      <span className="text-xs text-green-700">Visible to recruiters on your public profile</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* About Section */}
          {profile.bio && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-gray-900">About</h2>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Skills Section */}
          {skills.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
                <span className="text-sm text-gray-500">{skills.length} skills</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((sk) => (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700"
                  >
                    {sk}
                    <button
                      onClick={() => removeSkill(sk)}
                      className="text-gray-400 hover:text-red-500 transition"
                      aria-label={`Remove ${sk}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Skill Input */}
              <div className="flex gap-2 mt-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    placeholder="Add a skill (e.g. Verilog, STA, Python)..."
                  />
                </div>
                <Button size="sm" type="button" onClick={addSkill} className="h-auto">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>
            </div>
          )}

          {/* Empty State - No Sections */}
          {!profile.bio && skills.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-900 font-medium">Complete your profile</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">Add your bio, skills, and experience to stand out</p>
              <Button variant="primary" size="sm" onClick={() => setIsEditModalOpen(true)}>
                <Pencil className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Profile Completeness */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Profile Completeness</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${completenessPercent}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">{completenessPercent}%</span>
            </div>
            <div className="space-y-2">
              {completenessItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center",
                    item.done ? "bg-green-100" : "bg-gray-100"
                  )}>
                    {item.done && <Check className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className={cn("text-sm", item.done ? "text-gray-700" : "text-gray-400")}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full flex items-center gap-3 p-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4 text-gray-400" />
                Edit Profile
              </button>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full flex items-center gap-3 p-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-400" />
                Add Experience
              </button>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full flex items-center gap-3 p-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Award className="w-4 h-4 text-gray-400" />
                Add Certification
              </button>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full flex items-center gap-3 p-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-gray-400" />
                Add Project
              </button>
            </div>
          </div>

          {/* Contact & Links */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Links</h3>
            <div className="space-y-2">
              {profile.linkedin_url ? (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </a>
              ) : (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full text-left p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 hover:border-gray-300 transition-colors flex items-center gap-2"
                >
                  <Linkedin className="w-4 h-4" /> Add LinkedIn
                </button>
              )}

              {profile.github_url ? (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Github className="w-4 h-4" /> GitHub
                </a>
              ) : (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full text-left p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 hover:border-gray-300 transition-colors flex items-center gap-2"
                >
                  <Github className="w-4 h-4" /> Add GitHub
                </button>
              )}

              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Globe className="w-4 h-4" /> Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
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
