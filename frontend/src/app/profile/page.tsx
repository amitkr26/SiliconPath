"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, X, Plus, MapPin, Briefcase, FileText } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface Profile {
  display_name?: string;
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
}

function initials(name?: string): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
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
        setProfile(existing);
        setSkills(existing.skills || []);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile({ display_name: user.user_metadata?.full_name || "" });
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  const update = (patch: Partial<Profile>) => setProfile((prev) => ({ ...prev, ...patch }));

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setNewSkill("");
  };

  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  const save = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/profile/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: profile.display_name,
          headline: profile.headline,
          bio: profile.bio,
          job_title: profile.job_title,
          current_company: profile.current_company,
          location: profile.location,
          country: profile.country,
          website_url: profile.website_url,
          linkedin_url: profile.linkedin_url,
          github_url: profile.github_url,
          experience_years: profile.experience_years,
          is_open_to_work: profile.is_open_to_work,
          skills,
        }),
      });
      if (res.ok) toast.success("Profile saved!");
      else toast.error("Failed to save");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || profileLoading) {
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
        {/* Header card */}
        <div className="bg-bg-secondary border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-accent/15 text-accent flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {initials(profile.display_name)}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-text-primary truncate">
                {profile.display_name || "Your name"}
              </h1>
              {profile.headline && (
                <p className="text-sm text-text-secondary">{profile.headline}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-text-muted">
                {(profile.job_title || profile.current_company) && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {[profile.job_title, profile.current_company].filter(Boolean).join(" at ")}
                  </span>
                )}
                {(profile.location || profile.country) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[profile.location, profile.country].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={save} className="space-y-6">
          {/* About */}
          <div className="bg-bg-secondary border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-3">About</h2>
            <textarea
              value={profile.bio || ""}
              onChange={(e) => update({ bio: e.target.value })}
              placeholder="Write a brief description about yourself..."
              maxLength={500}
              rows={4}
              className={`${inputCls} resize-none`}
            />
            <p className="text-xs text-text-muted text-right mt-1">{(profile.bio || "").length}/500</p>
          </div>

          {/* Skills */}
          <div className="bg-bg-secondary border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-bg-primary border border-border text-xs text-text-primary"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="text-text-muted hover:text-danger"
                    aria-label={`Remove ${s}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <div className="inline-flex items-center gap-1">
                <input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Add skill"
                  className="w-28 bg-bg-primary border border-border text-text-primary text-xs rounded-full px-3 py-1.5 focus:ring-accent focus:border-accent outline-none"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="text-accent hover:text-accent"
                  aria-label="Add skill"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">Profile details</h2>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Full name</label>
              <input value={profile.display_name || ""} onChange={(e) => update({ display_name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Headline</label>
              <input value={profile.headline || ""} onChange={(e) => update({ headline: e.target.value })} placeholder="VLSI Design Engineer | RTL & Verification" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Current role</label>
                <input value={profile.job_title || ""} onChange={(e) => update({ job_title: e.target.value })} placeholder="RTL Design Engineer" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Company / Institute</label>
                <input value={profile.current_company || ""} onChange={(e) => update({ current_company: e.target.value })} placeholder="IIT Delhi" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Location</label>
                <input value={profile.location || ""} onChange={(e) => update({ location: e.target.value })} placeholder="Bangalore" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Country</label>
                <input value={profile.country || ""} onChange={(e) => update({ country: e.target.value })} placeholder="India" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">LinkedIn URL</label>
                <input value={profile.linkedin_url || ""} onChange={(e) => update({ linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">GitHub URL</label>
                <input value={profile.github_url || ""} onChange={(e) => update({ github_url: e.target.value })} placeholder="https://github.com/..." className={inputCls} />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-text-primary">
                <input
                  type="checkbox"
                  checked={!!profile.is_open_to_work}
                  onChange={(e) => update({ is_open_to_work: e.target.checked })}
                  className="w-4 h-4 accent-accent"
                />
                Show that I&apos;m open to opportunities
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Link href="/resume" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
              <FileText className="w-4 h-4" /> Resume builder
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-accent text-white text-sm font-semibold rounded-lg px-5 py-2.5 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
