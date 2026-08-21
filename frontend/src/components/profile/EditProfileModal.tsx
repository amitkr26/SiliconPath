"use client";

// Extracted from the /profile page: LinkedIn-style edit modal.
// Owns the form + skills editor; saves via PATCH /api/profile/{userId}.
// Used by both the /profile setup page and the public /profile/[username] own-view.

import { useState } from "react";
import { Loader2, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { RESERVED_USERNAMES } from "@/lib/utils";

export interface EditProfileData {
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
  is_open_to_work?: boolean;
  avatar_url?: string | null;
  skills?: string[];
}

interface Props {
  userId: string;
  profile: EditProfileData;
  onClose: () => void;
  onSaved: (updated: EditProfileData) => void;
}

export default function EditProfileModal({ userId, profile, onClose, onSaved }: Props) {
  const [form, setForm] = useState<EditProfileData>(profile || {});
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [saving, setSaving] = useState(false);

  const setField = (key: string, value: string) => setForm({ ...form, [key]: value });

  const handleUsernameChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setForm({ ...form, username: clean });
    if (clean && RESERVED_USERNAMES.includes(clean)) {
      setUsernameError("This username is reserved and cannot be used.");
    } else if (clean && (clean.length < 3 || clean.length > 40)) {
      setUsernameError("Username must be 3–40 characters.");
    } else {
      setUsernameError("");
    }
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setNewSkill("");
    }
  };

  const removeSkill = (s: string) => {
    setSkills(skills.filter((x) => x !== s));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/profile/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: form.display_name,
          username: form.username,
          headline: form.headline,
          bio: form.bio,
          job_title: form.job_title,
          current_company: form.current_company,
          location: form.location,
          country: form.country,
          website_url: form.website_url,
          linkedin_url: form.linkedin_url,
          github_url: form.github_url,
          is_open_to_work: form.is_open_to_work,
          skills: skills,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error && data.error.includes("username")) {
          setUsernameError(data.error);
        }
        toast.error(data.error || "Failed to update profile.");
        return;
      }

      onSaved({ ...form, skills });
      toast.success("Profile updated successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-4 border-slate-900 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-elevated space-y-5">
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Pencil className="w-5 h-5 text-blue-600" /> Edit LinkedIn Intro & Handle
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700">
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
              Full Display Name *
            </label>
            <input
              type="text"
              value={form.display_name || ""}
              onChange={(e) => setField("display_name", e.target.value)}
              required
              className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-card focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
              Unique Hardware Handle (@username) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">@</span>
              <input
                type="text"
                value={form.username || ""}
                onChange={(e) => handleUsernameChange(e.target.value)}
                required
                className="w-full pl-8 pr-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-card focus:outline-none"
              />
            </div>
            {usernameError && <p className="text-[11px] font-bold text-red-600 mt-1">{usernameError}</p>}
            {!usernameError && form.username && (
              <p className="text-[11px] font-bold text-emerald-600 mt-1">
                Your public profile: berojgardegreewala.vercel.app/profile/{form.username}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
              Professional Headline
            </label>
            <input
              type="text"
              value={form.headline || ""}
              onChange={(e) => setField("headline", e.target.value)}
              placeholder="e.g. M.Tech VLSI @ IIT Bombay | RISC-V & ASIC Design Lead"
              className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-card focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
              Location
            </label>
            <input
              type="text"
              value={form.location || ""}
              onChange={(e) => setField("location", e.target.value)}
              placeholder="e.g. Bengaluru, Karnataka, India"
              className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-card focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
              About / Summary
            </label>
            <textarea
              rows={4}
              value={form.bio || ""}
              onChange={(e) => setField("bio", e.target.value)}
              placeholder="Write a brief overview of your background, research interests, & hardware skills..."
              className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-card focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
              Skills & Endorsements
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.length === 0 && (
                <span className="text-xs font-bold text-slate-400">No skills added yet.</span>
              )}
              {skills.map((sk) => (
                <span
                  key={sk}
                  className="px-3 py-1.5 bg-slate-100 border-2 border-slate-900 rounded-xl text-xs font-black text-slate-900 shadow-card-sm flex items-center gap-2"
                >
                  {sk}
                  <button type="button" onClick={() => removeSkill(sk)} className="hover:text-red-600 transition">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Add hardware skill (e.g. Verilog, UVM, STA)..."
                className="flex-1 px-4 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-card-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs border-2 border-slate-900 rounded-xl shadow-card-sm flex items-center gap-1 transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={form.linkedin_url || ""}
                onChange={(e) => setField("linkedin_url", e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-3 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                GitHub URL
              </label>
              <input
                type="url"
                value={form.github_url || ""}
                onChange={(e) => setField("github_url", e.target.value)}
                placeholder="https://github.com/username"
                className="w-full px-3 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 rounded-xl text-xs font-black text-slate-900 shadow-card-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white border-2 border-slate-900 rounded-xl text-xs font-black shadow-card flex items-center gap-2 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
