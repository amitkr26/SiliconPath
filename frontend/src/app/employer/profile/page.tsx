"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2, User, Globe, Linkedin, MapPin, Briefcase,
  Sparkles, CheckCircle2, AlertCircle, ExternalLink, Pencil,
  Save, Loader2, ArrowRight, ShieldCheck, Check
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RESERVED_USERNAMES } from "@/lib/utils";

export default function EmployerProfilePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [interests, setInterests] = useState<string[]>([]); // Hiring focus
  const [newInterest, setNewInterest] = useState("");

  // Username validation state
  const [usernameError, setUsernameError] = useState("");

  // Completeness score
  const [completenessScore, setCompletenessScore] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/login?redirect=/employer/profile");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await api.get<{ profile: any }>("/api/profile/me");
        if (res?.profile) {
          const p = res.profile;
          setDisplayName(p.display_name || "");
          setUsername(p.username || "");
          setOriginalUsername(p.username || "");
          setHeadline(p.headline || "");
          setBio(p.bio || "");
          setCurrentCompany(p.current_company || "");
          setJobTitle(p.job_title || "");
          setLocation(p.location || "");
          setWebsiteUrl(p.website_url || "");
          setLinkedinUrl(p.linkedin_url || "");
          setSkills(p.skills || []);
          setInterests(p.interests || []);

          calculateCompleteness(p);
        }
      } catch (err: any) {
        toast.error("Failed to load employer profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, userLoading, router]);

  const calculateCompleteness = (p: any) => {
    let score = 0;
    const missing: string[] = [];

    if (p.display_name?.trim()) score += 15;
    else missing.push("Display / Recruiter Name");

    if (p.current_company?.trim()) score += 20;
    else missing.push("Organization / Company Name");

    if (p.headline?.trim()) score += 15;
    else missing.push("Headline / Scope");

    if (p.bio?.trim()) score += 15;
    else missing.push("Company Overview / Bio");

    if (p.website_url?.trim()) score += 10;
    else missing.push("Official Website URL");

    if (p.location?.trim()) score += 10;
    else missing.push("Headquarters / Location");

    if (p.skills && p.skills.length > 0) score += 10;
    else missing.push("Semiconductor Domain Specialties");

    if (p.interests && p.interests.length > 0) score += 5;
    else missing.push("Hiring Focus / Active Roles");

    setCompletenessScore(score);
    setMissingFields(missing);
  };

  const handleUsernameChange = (val: string) => {
    const clean = val.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsername(clean);

    if (clean.length < 3) {
      setUsernameError("Username must be at least 3 characters");
    } else if (clean.length > 30) {
      setUsernameError("Username must be at most 30 characters");
    } else if (RESERVED_USERNAMES.includes(clean)) {
      setUsernameError("This username is reserved by the system");
    } else {
      setUsernameError("");
    }
  };

  const handleSaveProfile = async () => {
    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        display_name: displayName.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        current_company: currentCompany.trim(),
        job_title: jobTitle.trim(),
        location: location.trim(),
        website_url: websiteUrl.trim(),
        linkedin_url: linkedinUrl.trim(),
        skills,
        interests,
      };

      if (username && username !== originalUsername) {
        payload.username = username;
      }

      const res = await api.patch<{ profile: any }>("/api/profile/me", payload);
      if (res?.profile) {
        toast.success("Employer profile updated successfully!");
        setOriginalUsername(res.profile.username || username);
        calculateCompleteness(res.profile);
        setIsEditing(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (s: string) => {
    setSkills(skills.filter((item) => item !== s));
  };

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (i: string) => {
    setInterests(interests.filter((item) => item !== i));
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-900">Loading Employer Profile Studio...</p>
      </div>
    );
  }

  const publicProfileUrl = `/profile/${username || originalUsername || user?.id}`;

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b-2 border-slate-900">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-800 text-xs font-bold mb-2">
              <Building2 className="w-3.5 h-3.5" /> Employer Profile Studio
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Organization &amp; Recruiter Profile</h1>
            <p className="text-slate-600 text-sm font-medium mt-1">Manage your company branding, recruiter identity, and candidate-facing profile.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={publicProfileUrl}
              target="_blank"
              className="inline-flex items-center gap-2 bg-white text-slate-900 border-2 border-slate-900 font-bold rounded-xl px-4 py-2.5 shadow-brutal-sm hover:bg-slate-50 transition-all text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" /> Preview Public Profile
            </Link>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} size="sm">
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
              </Button>
            ) : (
              <Button onClick={handleSaveProfile} disabled={saving} size="sm">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                Save Changes
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLS: MAIN PROFILE DETAILS / EDITOR */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. IDENTITY & USERNAME CARD */}
            <Card className="p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center justify-between">
                <span>Identity &amp; Public Handle</span>
                <Badge tone="accent">Public URL</Badge>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Public Username / Slug
                  </label>
                  <div className="flex items-center">
                    <span className="bg-slate-100 border-2 border-r-0 border-slate-900 rounded-l-xl px-3 py-2.5 text-xs font-bold text-slate-500">
                      berojgardegreewala.com/profile/
                    </span>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="company-name"
                      className="flex-1 border-2 border-slate-900 rounded-r-xl px-3 py-2.5 text-xs font-bold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50"
                    />
                  </div>
                  {usernameError && (
                    <p className="text-xs text-red-600 font-bold mt-1">{usernameError}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Organization / Company Name
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value)}
                      placeholder="e.g. Apex Semiconductor Labs"
                      className="w-full border-2 border-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 bg-white focus:outline-hidden disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Recruiter / Contact Name
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Amit Sharma"
                      className="w-full border-2 border-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 bg-white focus:outline-hidden disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Designation / Role
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Lead Technical Recruiter"
                      className="w-full border-2 border-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 bg-white focus:outline-hidden disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Headquarters / Location
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Bangalore, India"
                      className="w-full border-2 border-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 bg-white focus:outline-hidden disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Headline / Value Proposition
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Hiring RTL Design & Verification Engineers for Next-Gen RISC-V Silicon"
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 bg-white focus:outline-hidden disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Company Overview &amp; Research Mission
                  </label>
                  <textarea
                    rows={4}
                    disabled={!isEditing}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your organization, semiconductor domains, culture, and what kind of freshers/engineers you seek..."
                    className="w-full border-2 border-slate-900 rounded-xl p-3 text-xs font-medium text-slate-900 bg-white focus:outline-hidden disabled:bg-slate-50"
                  />
                </div>
              </div>
            </Card>

            {/* 2. DOMAIN SPECIALTIES & HIRING FOCUS */}
            <Card className="p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                Semiconductor Domains &amp; Hiring Focus
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Domain Specialties (e.g. RTL, UVM, Physical Design, Embedded)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border-2 border-slate-900 rounded-full text-xs font-bold text-slate-900"
                      >
                        {s}
                        {isEditing && (
                          <button onClick={() => removeSkill(s)} className="text-red-500 hover:text-red-700">
                            &times;
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                        placeholder="Add domain (e.g. SystemVerilog, STA, Analog)"
                        className="flex-1 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                      />
                      <Button onClick={addSkill} variant="secondary" size="sm">Add</Button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Active Hiring Focus (Roles currently hiring for)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {interests.map((i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border-2 border-slate-900 rounded-full text-xs font-bold text-emerald-900"
                      >
                        {i}
                        {isEditing && (
                          <button onClick={() => removeInterest(i)} className="text-red-500 hover:text-red-700">
                            &times;
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                        placeholder="Add role (e.g. RTL Intern, JRF Fellow, GET)"
                        className="flex-1 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                      />
                      <Button onClick={addInterest} variant="secondary" size="sm">Add</Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* 3. OFFICIAL LINKS */}
            <Card className="p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                Official Web &amp; Social Links
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" /> Organization Website
                  </label>
                  <input
                    type="url"
                    disabled={!isEditing}
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 bg-white focus:outline-hidden disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn Company Page
                  </label>
                  <input
                    type="url"
                    disabled={!isEditing}
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                    className="w-full border-2 border-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 bg-white focus:outline-hidden disabled:bg-slate-50"
                  />
                </div>
              </div>
            </Card>

          </div>

          {/* RIGHT COL: PROFILE OPTIMIZATION & ACTIONS */}
          <div className="space-y-6">
            
            {/* OPTIMIZE PROFILE WIDGET */}
            <Card className="p-6 bg-gradient-to-br from-white to-blue-50 border-2 border-slate-900">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" /> Profile Optimization
                </span>
                <span className="text-lg font-black text-slate-900">{completenessScore}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-200 border border-slate-900 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                  style={{ width: `${completenessScore}%` }}
                />
              </div>

              {missingFields.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-800">Recommendations to reach 100%:</p>
                  <ul className="space-y-1.5">
                    {missingFields.map((field) => (
                      <li key={field} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>Add <strong>{field}</strong></span>
                      </li>
                    ))}
                  </ul>
                  {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} variant="secondary" size="sm" className="w-full mt-4">
                      Optimize Now
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold bg-emerald-50 border border-emerald-300 p-3 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Profile is 100% complete! Candidates see a verified, professional employer profile.</span>
                </div>
              )}
            </Card>

            {/* QUICK ACTIONS */}
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Quick Actions</h3>
              
              <Link
                href="/employer/jobs/new"
                className="flex items-center justify-between p-3 rounded-xl border-2 border-slate-900 bg-white hover:bg-blue-50 text-xs font-bold text-slate-900 shadow-brutal-sm transition-all"
              >
                <span>Post New Opportunity</span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </Link>

              <Link
                href="/employer/talent"
                className="flex items-center justify-between p-3 rounded-xl border-2 border-slate-900 bg-white hover:bg-blue-50 text-xs font-bold text-slate-900 shadow-brutal-sm transition-all"
              >
                <span>Search Candidate Talent</span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </Link>

              <Link
                href="/employer/settings"
                className="flex items-center justify-between p-3 rounded-xl border-2 border-slate-900 bg-white hover:bg-blue-50 text-xs font-bold text-slate-900 shadow-brutal-sm transition-all"
              >
                <span>Notification Settings</span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </Link>
            </Card>

          </div>

        </div>

      </div>
    </div>
  );
}
