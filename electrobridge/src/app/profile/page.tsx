// src/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Loader2, Save, Camera, MapPin, Briefcase,
  GraduationCap, Check, X, Plus, Edit3, Share2,
  FileText, Sparkles, UploadCloud, FileType
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { UserProfile as ProfileType, SkillEndorsement, Recommendation } from "@/types";
import ResumeBuilder from "@/components/profile/ResumeBuilder";

const OPEN_TO_WORK_TYPES = ["JRF", "SRF", "PhD", "Private Job", "Fellowship", "Postdoc"];

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "builder">("details");
  const [user, setUser] = useState<any>(null);

  const [profile, setProfile] = useState<Partial<ProfileType>>({});
  const [endorsements, setEndorsements] = useState<SkillEndorsement[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [skillInput, setSkillInput] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    // Check if redirecting with builder tab active
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "builder") {
        setActiveTab("builder");
      }
    }

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) { router.push("/login"); return; }
      setUser(data.user);
      const { data: existing } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      if (existing) {
        setProfile(existing);
        setSkills(existing.skills || []);
      } else {
        setProfile({ full_name: data.user?.user_metadata?.full_name || "" });
      }
      loadEndorsements(data.user.id);
      loadRecommendations(data.user.id);
      setLoading(false);
    });
  }, [router]);

  const loadEndorsements = async (userId: string) => {
    try {
      const res = await fetch(`/api/profile/${userId}/endorse`);
      const data = await res.json();
      setEndorsements(data.endorsements || []);
    } catch {}
  };

  const loadRecommendations = async (userId: string) => {
    try {
      const res = await fetch(`/api/profile/${userId}/recommendations`);
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch {}
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) { router.push("/login"); return; }

      const res = await fetch(`/api/profile/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, skills, updated_at: new Date().toISOString() }),
      });

      if (res.ok) {
        toast.success("Profile saved!");
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfileDirect = async (updates: any) => {
    try {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      
      const res = await fetch(`/api/profile/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, ...updates, updated_at: new Date().toISOString() }),
      });
      if (res.ok) {
        setProfile((prev) => ({ ...prev, ...updates }));
        if (updates.skills) setSkills(updates.skills);
      }
    } catch {}
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file only.");
      return;
    }

    setParsing(true);
    const toastId = toast.loading("AI is parsing your resume PDF...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/parse-resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.profile) {
        const p = data.profile;
        setProfile((prev) => ({
          ...prev,
          full_name: p.full_name || prev.full_name,
          headline: p.headline || prev.headline,
          about: p.about || prev.about,
          current_position: p.current_position || prev.current_position,
          current_org: p.current_org || prev.current_org,
          city: p.city || prev.city,
          country: p.country || prev.country,
          website_url: p.website_url || prev.website_url
        }));
        if (p.skills && p.skills.length > 0) {
          setSkills(p.skills);
        }
        toast.success("Resume parsed! Profile details auto-filled.", { id: toastId });
      } else {
        toast.error(data.error || "Failed to parse resume", { id: toastId });
      }
    } catch {
      toast.error("An error occurred during resume parsing", { id: toastId });
    } finally {
      setParsing(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
    }
    setNewSkill("");
    setSkillInput(false);
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const getEndorsementCount = (skill: string) => {
    return endorsements.filter((e) => e.skill === skill).length;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 no-print">
      {/* Banner */}
      <div className="h-32 sm:h-44 rounded-xl bg-gradient-to-r from-accent/30 via-accent/20 to-accent/5 mb-16 relative overflow-hidden">
        {profile.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Header */}
      <div className="relative -mt-24 mb-6 flex flex-col sm:flex-row items-start sm:items-end gap-4 px-4">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-surface border-4 border-bg-primary overflow-hidden flex items-center justify-center bg-gradient-to-br from-accent/30 to-accent/5 flex-shrink-0">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-accent">
              {getInitials(profile.full_name || "") || "?"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 pt-2 sm:pt-0">
          <h1 className="text-2xl font-bold text-text-primary">{profile.full_name || "Your Name"}</h1>
          {profile.headline && <p className="text-text-secondary text-sm mt-0.5">{profile.headline}</p>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary">
            {(profile.current_position || profile.current_org) && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {profile.current_position}{profile.current_position && profile.current_org ? " at " : ""}{profile.current_org}
              </span>
            )}
            {(profile.city || profile.country) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {[profile.city, profile.country].filter(Boolean).join(", ")}
              </span>
            )}
            {profile.connection_count !== undefined && (
              <Link href="/network" className="hover:text-accent">
                {profile.connection_count} connections
              </Link>
            )}
            {profile.follower_count !== undefined && (
              <span>{profile.follower_count} followers</span>
            )}
          </div>
        </div>
      </div>

      {/* Premium Navigation Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-display text-sm font-semibold transition-all ${
            activeTab === "details" ? "border-accent text-accent" : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <User className="w-4 h-4" /> Profile details
        </button>
        <button
          onClick={() => setActiveTab("builder")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-display text-sm font-semibold transition-all ${
            activeTab === "builder" ? "border-accent text-accent" : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <FileText className="w-4 h-4" /> AI Resume Builder
        </button>
      </div>

      {activeTab === "details" && (
        <div className="space-y-6">
          {/* PDF Drag and Drop Parser Widget */}
          <section className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full filter blur-xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-accent/15 p-4 rounded-xl text-accent">
                <UploadCloud className="w-10 h-10 animate-bounce" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-1">
                <h3 className="font-display font-bold text-text-primary text-base flex items-center justify-center md:justify-start gap-1.5">
                  <Sparkles className="w-4 h-4 text-accent" /> Auto-Fill Profile from Resume PDF
                </h3>
                <p className="text-text-secondary text-xs">
                  Upload your resume PDF. SiliconPath AI will automatically parse the text, extract your experience, skills, and bio, and fill your profile settings instantly.
                </p>
              </div>
              <div className="relative">
                <input
                  type="file"
                  id="resume-pdf-uploader"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  disabled={parsing}
                  className="hidden"
                />
                <label
                  htmlFor="resume-pdf-uploader"
                  className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-bg-primary font-bold px-5 py-2.5 rounded-lg text-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Parsing...
                    </>
                  ) : (
                    <>
                      <FileType className="w-4 h-4" /> Choose Resume PDF
                    </>
                  )}
                </label>
              </div>
            </div>
          </section>

          <form onSubmit={handleSave} className="space-y-6">
            {/* About */}
            <section className="bg-surface border border-border rounded-xl p-6">
              <h2 className="font-display text-lg font-bold text-text-primary mb-4">About</h2>
              <textarea
                value={profile.about || ""}
                onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                placeholder="Write a brief description about yourself (max 500 characters)..."
                maxLength={500}
                rows={4}
                className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none resize-none"
              />
              <p className="text-text-muted text-xs mt-1">{(profile.about || "").length}/500</p>
            </section>

            {/* Skills */}
            <section className="bg-surface border border-border rounded-xl p-6">
              <h2 className="font-display text-lg font-bold text-text-primary mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map((skill) => {
                  const count = getEndorsementCount(skill);
                  return (
                    <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-xs font-medium group">
                      {skill}
                      {count > 0 && (
                        <span className="text-text-secondary text-[10px] ml-0.5">· {count} {count === 1 ? "endorsement" : "endorsements"}</span>
                      )}
                      <button type="button" onClick={() => removeSkill(skill)} className="text-text-muted hover:text-danger transition-colors hidden group-hover:inline-flex">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                {skillInput ? (
                  <span className="inline-flex items-center gap-1">
                    <input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      placeholder="Add a skill..."
                      className="w-28 bg-bg-primary border border-border text-text-primary text-xs rounded-lg px-2 py-1.5 focus:ring-accent focus:border-accent outline-none"
                      autoFocus
                    />
                    <button type="button" onClick={addSkill} className="text-accent hover:text-accent-hover"><Check className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => { setSkillInput(false); setNewSkill(""); }} className="text-text-muted hover:text-text-primary"><X className="w-3.5 h-3.5" /></button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setSkillInput(true)} className="inline-flex items-center gap-1 px-3 py-1.5 border border-dashed border-border rounded-full text-xs text-text-secondary hover:text-accent hover:border-accent transition-colors">
                    <Plus className="w-3 h-3" /> Add Skill
                  </button>
                )}
              </div>
            </section>

            {/* Profile Fields */}
            <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-text-primary">Profile Details</h2>
              <div>
                <label className="block text-text-secondary text-xs font-medium mb-1.5">Full Name</label>
                <input value={profile.full_name || ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none" />
              </div>
              <div>
                <label className="block text-text-secondary text-xs font-medium mb-1.5">Headline</label>
                <input value={profile.headline || ""} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} placeholder="JRF at DRDO | MSc Electronics | NET Qualified" className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-xs font-medium mb-1.5">Current Position</label>
                  <input value={profile.current_position || ""} onChange={(e) => setProfile({ ...profile, current_position: e.target.value })} placeholder="Junior Research Fellow" className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none" />
                </div>
                <div>
                  <label className="block text-text-secondary text-xs font-medium mb-1.5">Current Organization</label>
                  <input value={profile.current_org || ""} onChange={(e) => setProfile({ ...profile, current_org: e.target.value })} placeholder="DRDO" className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-xs font-medium mb-1.5">City</label>
                  <input value={profile.city || ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} placeholder="New Delhi" className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none" />
                </div>
                <div>
                  <label className="block text-text-secondary text-xs font-medium mb-1.5">Country</label>
                  <input value={profile.country || "India"} onChange={(e) => setProfile({ ...profile, country: e.target.value })} className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-text-secondary text-xs font-medium mb-1.5">Website</label>
                <input value={profile.website_url || ""} onChange={(e) => setProfile({ ...profile, website_url: e.target.value })} placeholder="https://" className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none" />
              </div>
            </section>

            {/* Open to Work */}
            <section className="bg-surface border border-border rounded-xl p-6">
              <h2 className="font-display text-lg font-bold text-text-primary mb-4">Open to Opportunities</h2>
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={profile.is_open_to_work || false}
                  onChange={(e) => setProfile({ ...profile, is_open_to_work: e.target.checked })}
                  className="w-5 h-5 accent-accent"
                />
                <span className="text-text-primary text-sm">Show on profile that I&apos;m open to work</span>
              </label>
              {profile.is_open_to_work && (
                <div className="space-y-3 pl-8">
                  <label className="block text-text-secondary text-xs font-medium mb-1">Open to</label>
                  <div className="flex flex-wrap gap-2">
                    {OPEN_TO_WORK_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          const types = profile.open_to_work_types || [];
                          setProfile({
                            ...profile,
                            open_to_work_types: types.includes(type) ? types.filter((t) => t !== type) : [...types, type],
                          });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          (profile.open_to_work_types || []).includes(type)
                            ? "bg-accent text-bg-primary"
                            : "bg-bg-primary text-text-secondary border border-border"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Recommendations */}
            <section className="bg-surface border border-border rounded-xl p-6">
              <h2 className="font-display text-lg font-bold text-text-primary mb-4">Recommendations Received ({recommendations.length})</h2>
              {recommendations.length === 0 ? (
                <p className="text-text-muted text-sm">No recommendations yet.</p>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="bg-bg-primary rounded-lg p-4 border border-border/50">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-accent text-xs font-bold">{getInitials(rec.author?.full_name || "")}</span>
                        </div>
                        <div>
                          <p className="text-text-primary text-sm font-medium">{rec.author?.full_name}</p>
                          {rec.relationship && <p className="text-text-muted text-xs">{rec.relationship}</p>}
                          <p className="text-text-secondary text-sm mt-2">{rec.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-accent text-bg-primary font-semibold rounded-lg px-6 py-2.5 text-sm hover:bg-accent-hover transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "builder" && user && (
        <ResumeBuilder
          initialData={{
            full_name: profile.full_name || "",
            email: user.email || "",
            headline: profile.headline || "",
            skills: skills,
            summary: profile.about || "",
            location: [profile.city, profile.country].filter(Boolean).join(", ") || "India"
          }}
          userId={user.id}
          onSaveProfile={handleSaveProfileDirect}
        />
      )}
    </div>
  );
}
