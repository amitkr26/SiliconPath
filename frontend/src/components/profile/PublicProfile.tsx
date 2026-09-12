"use client";

// Public profile view shared by /people/[username] and /profile/[username].
// Enhanced with LinkedIn-caliber layout, circuit banner, organization badges,
// open-to-work card, and right sidebar with profile URL and recommended peers.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, MapPin, Briefcase, Check, MessageCircle, UserPlus,
  UserCheck, Pencil, Share2, Star, Send, GraduationCap, Code2,
  Award, Trophy, ExternalLink, Calendar, Sparkles, Users, Globe,
  Mail, Github, Linkedin, ShieldCheck, Copy, CheckCircle2, Building2
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import type {
  UserProfile,
  SkillEndorsement,
  Recommendation,
  CandidateExperience,
  CandidateEducation,
  CandidateProject,
  CandidateCertification,
  CandidateAchievement,
  ProfileCompleteness,
} from "@/types";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

interface Props {
  username: string;
  initialProfile?: UserProfile | null;
  notFoundBackHref?: string;
}

export default function PublicProfile({ username, initialProfile, notFoundBackHref = "/feed" }: Props) {
  const { user: currentUser, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile || null);
  const [experiences, setExperiences] = useState<CandidateExperience[]>([]);
  const [educations, setEducations] = useState<CandidateEducation[]>([]);
  const [projects, setProjects] = useState<CandidateProject[]>([]);
  const [certifications, setCertifications] = useState<CandidateCertification[]>([]);
  const [achievements, setAchievements] = useState<CandidateAchievement[]>([]);
  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);
  const [mutualCount, setMutualCount] = useState<number>(0);
  const [endorsements, setEndorsements] = useState<SkillEndorsement[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [recContent, setRecContent] = useState("");
  const [recRelationship, setRecRelationship] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (userLoading) return;

    const loadData = async () => {
      try {
        let profileData: any;
        if (!currentUser && initialProfile) {
          profileData = initialProfile;
        } else {
          profileData = await api.get<any>(`/api/profile/${username}`);
        }
        if (!profileData) { setLoading(false); return; }
        setProfile(profileData);
        if (profileData.experiences) setExperiences(profileData.experiences);
        if (profileData.educations) setEducations(profileData.educations);
        if (profileData.projects) setProjects(profileData.projects);
        if (profileData.certifications) setCertifications(profileData.certifications);
        if (profileData.achievements) setAchievements(profileData.achievements);
        if (profileData.completeness) setCompleteness(profileData.completeness);
        if (profileData.mutual_connections_count) setMutualCount(profileData.mutual_connections_count);

        if (currentUser) {
          if (currentUser.id !== profileData.id) {
            loadRelationship(currentUser.id, profileData.id);
          }
          loadEndorsements(profileData.id);
          loadRecommendations(profileData.id);
        }
      } catch {
        // profile not found or error
      }
      setLoading(false);
    };

    loadData();
  }, [username, currentUser, userLoading]);

  const loadRelationship = async (myId: string, theirId: string) => {
    try {
      const conn = await api.get<any>("/api/network/connections", {
        params: { myId, theirId },
      });
      if (conn?.status) {
        setConnectionStatus(conn.status);
        if (conn.status === "accepted") setIsConnected(true);
      }
    } catch {
      // ignore
    }

    try {
      const follow = await api.get<{ following: boolean }>(`/api/network/follow/${theirId}`);
      setIsFollowing(!!follow?.following);
    } catch {
      // ignore
    }
  };

  const loadEndorsements = async (profileOwnerId: string) => {
    try {
      const data = await api.get<{ endorsements: SkillEndorsement[] }>(
        `/api/profile/${username}/endorsements`
      );
      if (data?.endorsements) setEndorsements(data.endorsements);
    } catch {
      // ignore
    }
  };

  const loadRecommendations = async (profileOwnerId: string) => {
    try {
      const data = await api.get<{ recommendations: Recommendation[] }>(
        `/api/profile/${username}/recommendations`
      );
      if (data?.recommendations) setRecommendations(data.recommendations);
    } catch {
      // ignore
    }
  };

  const handleConnect = async () => {
    if (!currentUser || !profile) return;
    try {
      await api.post("/api/network/connect", { receiverId: profile.id });
      setConnectionStatus("pending");
      toast.success("Connection request sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send connection request");
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    try {
      if (isFollowing) {
        await api.delete(`/api/network/follow/${profile.id}`);
        setIsFollowing(false);
        toast.success("Unfollowed");
      } else {
        await api.post(`/api/network/follow/${profile.id}`);
        setIsFollowing(true);
        toast.success("Following");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update follow");
    }
  };

  const handleEndorse = async (skill: string) => {
    if (!currentUser || !profile) {
      toast.error("Please login to endorse skills");
      return;
    }
    if (currentUser.id === profile.id) {
      toast.info("You cannot endorse your own skills");
      return;
    }
    const already = endorsements.some((e) => e.endorser_id === currentUser.id && e.skill === skill);
    try {
      if (already) {
        await api.delete(`/api/profile/${username}/endorsements`, {
          params: { skill },
        });
        setEndorsements((prev) => prev.filter((e) => !(e.endorser_id === currentUser.id && e.skill === skill)));
        toast.success(`Removed endorsement for ${skill}`);
      } else {
        const res = await api.post<SkillEndorsement>(`/api/profile/${username}/endorsements`, { skill });
        if (res) {
          setEndorsements((prev) => [...prev, res]);
          toast.success(`Endorsed ${skill}!`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update endorsement");
    }
  };

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile || !recContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post<Recommendation>(`/api/profile/${username}/recommendations`, {
        content: recContent,
        relationship: recRelationship,
      });
      if (res) {
        setRecommendations((prev) => [...prev, res]);
        toast.success("Recommendation sent!");
        setShowRecommendModal(false);
        setRecContent("");
        setRecRelationship("");
      }
    } catch {
      toast.error("Failed to send recommendation");
    }
    setSubmitting(false);
  };

  const handleShare = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/profile/${profile?.username || username}` : "";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success("Profile link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-black text-slate-900">Profile Not Found</h1>
        <p className="text-slate-600 text-sm mt-2 font-medium">This engineer hasn&apos;t published their public profile yet.</p>
        <Link href={notFoundBackHref} className="text-blue-600 font-bold text-sm mt-4 inline-block hover:underline">
          Back to Discussions
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const currentCompany = profile.current_company || experiences.find((e) => e.is_current)?.company_name;
  const latestEducation = educations[0]?.institution;

  const endorsedSkills = new Map<string, number>();
  endorsements.forEach((e) => {
    endorsedSkills.set(e.skill, (endorsedSkills.get(e.skill) || 0) + 1);
  });

  return (
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* MAIN COLUMN */}
        <div className="space-y-6 min-w-0">

          {/* IDENTITY CARD */}
          <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-card overflow-hidden">
            {/* Tech Cover Banner */}
            <div className="h-36 sm:h-48 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 border-b-2 border-slate-900 relative flex items-end justify-end p-4">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
              <div className="relative z-10 hidden sm:flex items-center gap-2">
                <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/30 rounded-lg">
                  BerojgarDegreeWala Verified Engineer
                </span>
              </div>
            </div>

            {/* Header Content with Overlapping Avatar */}
            <div className="px-5 sm:px-8 pb-6 relative">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
                {/* Avatar with Open-To-Work Ring */}
                <div className="relative">
                  <div
                    className={cn(
                      "w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white border-4 border-slate-900 shadow-brutal flex items-center justify-center overflow-hidden flex-shrink-0 relative",
                      profile.is_open_to_work && "ring-4 ring-emerald-500 ring-offset-2"
                    )}
                  >
                    <ImageWithFallback
                      src={profile.avatar_url}
                      alt={profile.display_name || "Profile"}
                      fallbackType="avatar"
                      fallbackName={profile.display_name || "User"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {profile.is_open_to_work && (
                    <span className="absolute bottom-1 right-1 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider rounded-full border border-white shadow-sm">
                      #OpenToWork
                    </span>
                  )}
                </div>

                {/* Top-Right Organization / Institution Badges */}
                <div className="hidden md:flex flex-col items-end gap-1.5 pt-2 text-right">
                  {currentCompany && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors">
                      <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{currentCompany}</span>
                    </div>
                  )}
                  {latestEducation && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                      <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{latestEducation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {profile.display_name}
                    </h1>
                    {profile.username && (
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        @{profile.username}
                      </span>
                    )}
                  </div>
                  {profile.headline && (
                    <p className="text-slate-800 text-sm sm:text-base font-semibold leading-snug max-w-2xl">
                      {profile.headline}
                    </p>
                  )}
                </div>

                {/* Primary CTAs */}
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end pt-2 sm:pt-0">
                  {!isOwnProfile && (
                    <>
                      {!isConnected && connectionStatus !== "pending" && (
                        <button
                          onClick={handleConnect}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-black rounded-xl text-xs border-2 border-slate-900 shadow-brutal-sm hover:shadow-brutal transition-all"
                        >
                          <UserPlus className="w-4 h-4" /> Connect
                        </button>
                      )}
                      {connectionStatus === "pending" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-900 border-2 border-slate-900 rounded-xl text-xs font-bold shadow-brutal-sm">
                          <UserCheck className="w-4 h-4 text-amber-600" /> Pending
                        </span>
                      )}
                      <Link
                        href={`/messages?userId=${profile.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-900 border-2 border-slate-900 rounded-xl text-xs font-black shadow-brutal-sm hover:bg-slate-50 transition-all"
                      >
                        <MessageCircle className="w-4 h-4 text-blue-600" /> Message
                      </Link>
                      <button
                        onClick={handleFollow}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border-2 border-slate-900 shadow-brutal-sm transition-all ${
                          isFollowing
                            ? "bg-slate-100 text-slate-700 hover:text-red-600"
                            : "bg-white text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </>
                  )}

                  {isOwnProfile && (
                    <>
                      <button
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-900 border-2 border-slate-900 rounded-xl text-xs font-black shadow-brutal-sm hover:bg-slate-50 transition-all"
                      >
                        <Share2 className="w-4 h-4 text-slate-600" /> Share
                      </button>
                      <button
                        onClick={() => setShowEditModal(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-black rounded-xl text-xs border-2 border-slate-900 shadow-brutal-sm hover:shadow-brutal transition-all"
                      >
                        <Pencil className="w-4 h-4" /> Edit Profile
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Location & Metadata Strip */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-600 font-semibold border-t border-slate-100">
                {(profile.location || profile.country) && (
                  <span className="flex items-center gap-1 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {[profile.location, profile.country].filter(Boolean).join(", ")}
                  </span>
                )}
                <button
                  onClick={() => setShowContactModal(true)}
                  className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  Contact info
                </button>
                <span className="text-slate-300">·</span>
                <span className="font-bold text-slate-900">
                  {profile.follower_count || 0} followers
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-bold text-slate-900">
                  {profile.connection_count || 0} connections
                </span>
                {!isOwnProfile && mutualCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    <Users className="w-3 h-3" /> {mutualCount} mutual
                  </span>
                )}
              </div>

              {/* Open to Work Showcase Card */}
              {profile.is_open_to_work && (
                <div className="mt-4 p-3.5 bg-emerald-50/80 border-2 border-slate-900 rounded-xl shadow-brutal-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        Open to work · Recruiters &amp; Fellows
                      </p>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      {profile.headline ? `${profile.headline} roles` : "Semiconductor & VLSI Engineering roles"}
                      {profile.location ? ` in ${profile.location} | On-site · Hybrid · Remote` : ""}
                    </p>
                  </div>
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="text-xs font-bold text-emerald-800 hover:underline shrink-0"
                    >
                      Edit preferences →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Profile Completeness Card (own profile only) */}
          {isOwnProfile && completeness && completeness.percentage < 100 && (
            <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 border-2 border-slate-900 shadow-brutal-sm">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h2 className="text-sm font-black text-slate-900">Profile Strength: {completeness.percentage}%</h2>
                </div>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="text-xs font-black text-blue-600 hover:underline"
                >
                  Boost Profile →
                </button>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full border border-slate-900 overflow-hidden mb-2">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
              {completeness.missingItems.length > 0 && (
                <p className="text-xs text-slate-600 font-medium">
                  Add <strong>{completeness.missingItems[0]}</strong> to stand out to hardware recruiters.
                </p>
              )}
            </Card>
          )}

          {/* About / Summary */}
          {profile.bio && (
            <Card className="p-6 border-2 border-slate-900 shadow-brutal-sm">
              <h2 className="text-base font-black text-slate-900 mb-2">About</h2>
              <p className="text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </Card>
          )}

          {/* Experience Timeline */}
          <Card className="p-6 border-2 border-slate-900 shadow-brutal-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-black text-slate-900">Experience</h2>
              </div>
              {isOwnProfile && (
                <button onClick={() => setShowEditModal(true)} className="text-xs font-black text-blue-600 hover:underline">
                  + Add Experience
                </button>
              )}
            </div>

            {experiences.length === 0 ? (
              <p className="text-slate-400 text-xs font-medium">No experience records added yet.</p>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="border-l-2 border-slate-300 pl-4 relative space-y-1">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-600" />
                    <h3 className="text-sm font-black text-slate-900">{exp.role_title}</h3>
                    <p className="text-xs font-bold text-slate-700">{exp.company_name} {exp.employment_type && `· ${exp.employment_type}`}</p>
                    <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {exp.start_date} – {exp.is_current ? "Present" : exp.end_date || "Present"}
                      {exp.location && ` · ${exp.location}`}
                    </p>
                    {exp.description && (
                      <p className="text-xs text-slate-600 pt-1 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                    )}
                    {exp.skills_used && exp.skills_used.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {exp.skills_used.map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold border border-slate-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Education */}
          <Card className="p-6 border-2 border-slate-900 shadow-brutal-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-black text-slate-900">Education</h2>
              </div>
              {isOwnProfile && (
                <button onClick={() => setShowEditModal(true)} className="text-xs font-black text-blue-600 hover:underline">
                  + Add Education
                </button>
              )}
            </div>

            {educations.length === 0 ? (
              <p className="text-slate-400 text-xs font-medium">No education history added yet.</p>
            ) : (
              <div className="space-y-4">
                {educations.map((edu) => (
                  <div key={edu.id} className="border-l-2 border-slate-300 pl-4 relative space-y-1">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-600" />
                    <h3 className="text-sm font-black text-slate-900">{edu.institution}</h3>
                    <p className="text-xs font-bold text-slate-700">
                      {edu.degree} {edu.field_of_study && `in ${edu.field_of_study}`}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {edu.start_year && `${edu.start_year} – `}{edu.end_year || "Present"}
                      {edu.grade && ` · Grade: ${edu.grade}`}
                    </p>
                    {edu.description && (
                      <p className="text-xs text-slate-600 pt-1 leading-relaxed whitespace-pre-wrap">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Projects */}
          <Card className="p-6 border-2 border-slate-900 shadow-brutal-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-black text-slate-900">Technical Projects &amp; Silicon Tapeouts</h2>
              </div>
              {isOwnProfile && (
                <button onClick={() => setShowEditModal(true)} className="text-xs font-black text-blue-600 hover:underline">
                  + Add Project
                </button>
              )}
            </div>

            {projects.length === 0 ? (
              <p className="text-slate-400 text-xs font-medium">No projects added yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((proj) => (
                  <div key={proj.id} className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 shadow-brutal-sm space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-black text-slate-900">{proj.title}</h3>
                        {proj.github_url && (
                          <a href={proj.github_url} target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {proj.description && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3 font-medium">{proj.description}</p>
                      )}
                    </div>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {proj.technologies.map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-white border border-slate-300 text-slate-700 rounded text-[10px] font-bold">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Skills & Endorsements */}
          <Card className="p-6 border-2 border-slate-900 shadow-brutal-sm space-y-4">
            <h2 className="text-base font-black text-slate-900">Skills &amp; Methodologies</h2>
            <div className="flex flex-wrap gap-2">
              {(profile.skills || []).length === 0 ? (
                <p className="text-slate-400 text-xs font-medium">No skills added yet.</p>
              ) : (
                (profile.skills || []).map((skill) => {
                  const count = endorsedSkills.get(skill) || 0;
                  const hasEndorsed = !!currentUser && endorsements.some((e) => e.endorser_id === currentUser.id && e.skill === skill);
                  return (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-slate-900 border-2 border-slate-900 rounded-xl text-xs font-black shadow-brutal-sm"
                    >
                      {skill}
                      {count > 0 && <span className="text-blue-700 font-black text-[10px]">· {count}</span>}
                      {!isOwnProfile && currentUser && (
                        <button
                          onClick={() => handleEndorse(skill)}
                          className={`transition-colors ml-0.5 ${hasEndorsed ? "text-amber-500" : "text-slate-400 hover:text-amber-500"}`}
                          title={hasEndorsed ? "Remove endorsement" : "Endorse skill"}
                        >
                          <Star className={`w-3.5 h-3.5 ${hasEndorsed ? "fill-amber-400 text-amber-500" : "text-slate-400"}`} />
                        </button>
                      )}
                    </span>
                  );
                })
              )}
            </div>
          </Card>

          {/* Honors, Certifications & Awards */}
          {(certifications.length > 0 || achievements.length > 0) && (
            <Card className="p-6 border-2 border-slate-900 shadow-brutal-sm space-y-4">
              <h2 className="text-base font-black text-slate-900">Honors, Certifications &amp; Awards</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {certifications.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <Award className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-black text-slate-900">{c.name}</h3>
                      <p className="text-[11px] font-semibold text-slate-600">{c.issuing_org} {c.issue_date && `· ${c.issue_date}`}</p>
                    </div>
                  </div>
                ))}
                {achievements.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <Trophy className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-black text-slate-900">{a.title}</h3>
                      <p className="text-[11px] font-semibold text-slate-600">{a.issuer} {a.date_awarded && `· ${a.date_awarded}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommendations */}
          <Card className="p-6 border-2 border-slate-900 shadow-brutal-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">Recommendations ({recommendations.length})</h2>
              {!isOwnProfile && currentUser && (
                <button
                  onClick={() => setShowRecommendModal(true)}
                  className="text-xs font-black text-blue-600 hover:underline"
                >
                  + Write Recommendation
                </button>
              )}
            </div>

            {recommendations.length === 0 ? (
              <p className="text-slate-400 text-xs font-medium">No recommendations received yet.</p>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-900">{(rec as any).recommender?.display_name || "Colleague"}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">{rec.relationship || "Professional Peer"}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic">&quot;{rec.content}&quot;</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-6">
          {/* Public Profile & URL Card */}
          <Card className="p-5 border-2 border-slate-900 shadow-brutal-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Public Profile &amp; URL</h3>
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-slate-600 font-medium break-all">
              {typeof window !== "undefined" ? `${window.location.host}/profile/${profile.username || username}` : `berojgardegreewala.vercel.app/profile/${profile.username || username}`}
            </p>
            <button
              onClick={handleShare}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-black border-2 border-slate-900 shadow-brutal-sm flex items-center justify-center gap-1.5 transition-all"
            >
              {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? "Copied to Clipboard!" : "Copy Public Link"}
            </button>
          </Card>

          {/* Hardware Badges Card */}
          <Card className="p-5 border-2 border-slate-900 shadow-brutal-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Scholar &amp; VLSI Verification</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Verified Candidate Identity</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Open to Direct Recruiter Outreach</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Semiconductor ATS Profile Active</span>
              </div>
            </div>
          </Card>

          {/* Quick Discover Opportunities */}
          <Card className="p-5 border-2 border-slate-900 shadow-brutal-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Explore Relevant Openings</h3>
            <p className="text-xs text-slate-600 font-medium">
              Discover verified positions matching your specialization.
            </p>
            <Link
              href="/opportunities"
              className="block w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black text-center border-2 border-slate-900 shadow-brutal-sm transition-all"
            >
              Browse 3,600+ Openings →
            </Link>
          </Card>
        </aside>

      </div>

      {/* Contact Info Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-4 border-slate-900 rounded-2xl max-w-md w-full p-6 shadow-brutal-lg space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" /> {profile.display_name}&apos;s Contact Info
              </h3>
              <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-700 font-black">
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              {(profile as any).email && (
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <a href={`mailto:${(profile as any).email}`} className="text-blue-600 hover:underline">{(profile as any).email}</a>
                </div>
              )}
              {profile.linkedin_url && (
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Linkedin className="w-4 h-4 text-blue-700" />
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn Profile</a>
                </div>
              )}
              {profile.github_url && (
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Github className="w-4 h-4 text-slate-900" />
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub Profile</a>
                </div>
              )}
              {profile.website_url && (
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{profile.website_url}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          userId={profile.id}
          profile={profile}
          initialExperiences={experiences}
          initialEducations={educations}
          initialProjects={projects}
          initialCertifications={certifications}
          initialAchievements={achievements}
          onClose={() => {
            setShowEditModal(false);
          }}
          onSaved={() => {
            setShowEditModal(false);
            window.location.reload();
          }}
        />
      )}

      {/* Recommendation Modal */}
      {showRecommendModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-4 border-slate-900 rounded-2xl max-w-md w-full p-6 shadow-brutal-lg space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Write Recommendation
              </h3>
              <button onClick={() => setShowRecommendModal(false)} className="text-slate-400 hover:text-slate-700 font-black">
                ✕
              </button>
            </div>
            <form onSubmit={handleRecommend} className="space-y-3">
              <input
                type="text"
                placeholder="Relationship (e.g. Managed Amit directly at Sony India)"
                value={recRelationship}
                onChange={(e) => setRecRelationship(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-bold"
              />
              <textarea
                rows={4}
                placeholder="Write your recommendation..."
                value={recContent}
                onChange={(e) => setRecContent(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-bold resize-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecommendModal(false)}
                  className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !recContent.trim()}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black border-2 border-slate-900 shadow-brutal-sm"
                >
                  {submitting ? "Submitting..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
