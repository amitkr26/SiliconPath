"use client";

// Public profile view shared by /people/[username] and /profile/[username].
// When initialProfile is provided (server-rendered) and the visitor is logged
// OUT, it renders that data directly — this is what makes the public profile
// URL work without auth. Logged-in visitors always fetch through the API
// (fresh data + profile view counting). Interactive bits (connect, endorse,
// recommend) only render for logged-in users.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, MapPin, Briefcase, Check, MessageCircle, UserPlus,
  UserCheck, Pencil, Share2, Star, Send, GraduationCap, Code2,
  Award, Trophy, ExternalLink, Calendar, Sparkles, Users
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
  const [recContent, setRecContent] = useState("");
  const [recRelationship, setRecRelationship] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (userLoading) return;

    const loadData = async () => {
      try {
        let profileData: any;
        if (!currentUser && initialProfile) {
          profileData = initialProfile; // server-rendered logged-out view
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
  }, [username, currentUser, userLoading]); // eslint-disable-line react-hooks/exhaustive-deps

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

    try {
      const mutual = await api.get<{ count: number }>("/api/network/mutual", {
        params: { targetUserId: theirId },
      });
      if (mutual?.count) setMutualCount(mutual.count);
    } catch {
      // ignore
    }
  };

  const loadEndorsements = async (userId: string) => {
    try {
      const data = await api.get<{ endorsements: SkillEndorsement[] }>(`/api/profile/${userId}/endorse`);
      setEndorsements(data.endorsements || []);
    } catch {
      /* ignore */
    }
  };

  const loadRecommendations = async (userId: string) => {
    try {
      const data = await api.get<{ recommendations: Recommendation[] }>(`/api/profile/${userId}/recommendations`);
      setRecommendations(data.recommendations || []);
    } catch {
      /* ignore */
    }
  };

  const handleEndorse = async (skill: string) => {
    if (!profile || !currentUser) {
      toast.info("Please log in to endorse skills");
      return;
    }
    if (isOwnProfile) {
      toast.info("You cannot endorse your own skills");
      return;
    }
    const hasEndorsed = endorsements.some((e) => e.endorser_id === currentUser.id && e.skill === skill);
    try {
      if (hasEndorsed) {
        await fetch(`/api/profile/${profile.id}/endorse`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skill }),
        });
        toast.success(`Removed endorsement for ${skill}`);
      } else {
        await api.post(`/api/profile/${profile.id}/endorse`, { skill });
        toast.success(`Endorsed ${skill}!`);
      }
      loadEndorsements(profile.id);
    } catch (err: any) {
      toast.error(err?.body?.error || "Failed to update endorsement");
    }
  };

  const handleConnect = async () => {
    if (!profile || !currentUser) return;
    try {
      await api.post("/api/network/connect", { receiverId: profile.id });
      toast.success("Connection request sent!");
      setConnectionStatus("pending");
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        const existing = err.body?.connection as { status?: string } | undefined;
        if (existing?.status === "accepted") {
          setIsConnected(true);
          setConnectionStatus("accepted");
          toast.info("Already connected");
        } else {
          setConnectionStatus("pending");
          toast.info("Connection request already pending");
        }
        return;
      }
      toast.error(err?.body?.error || "Failed to send request");
    }
  };

  const handleFollow = async () => {
    if (!profile || !currentUser) return;
    if (isFollowing) {
      try {
        await api.delete(`/api/network/follow/${profile.id}`);
        setIsFollowing(false);
        toast.success("Unfollowed");
      } catch (err: any) {
        toast.error(err?.body?.error || "Failed to unfollow");
      }
    } else {
      try {
        await api.post(`/api/network/follow/${profile.id}`);
        setIsFollowing(true);
        toast.success("Following!");
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 409) {
          setIsFollowing(true);
          toast.info("Already following");
          return;
        }
        toast.error(err?.body?.error || "Failed to follow");
      }
    }
  };

  const handleSubmitRecommendation = async () => {
    if (!profile || !recContent) return;
    setSubmitting(true);
    try {
      await api.post(`/api/profile/${profile.id}/recommendations`, {
        content: recContent,
        relationship: recRelationship,
      });
      toast.success("Recommendation sent!");
      setShowRecommendModal(false);
      setRecContent("");
      setRecRelationship("");
      loadRecommendations(profile.id);
    } catch {
      toast.error("Failed to send recommendation");
    }
    setSubmitting(false);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/profile/${profile?.username || username}`;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied!");
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-black text-slate-900">Profile Not Found</h1>
        <p className="text-slate-600 text-sm mt-2">This user hasn&apos;t set up their profile yet.</p>
        <Link href={notFoundBackHref} className="text-blue-600 font-bold text-sm mt-4 inline-block hover:underline">
          Back to Opportunities
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const endorsedSkills = new Map<string, number>();
  endorsements.forEach((e) => {
    endorsedSkills.set(e.skill, (endorsedSkills.get(e.skill) || 0) + 1);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Profile Container Card */}
      <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-card overflow-hidden">
        {/* Solid Cover Banner */}
        <div className="h-36 sm:h-44 bg-slate-900 border-b-2 border-slate-900 relative">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>

        {/* Identity Header */}
        <div className="px-5 sm:px-8 pb-6 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-3 border-slate-900 shadow-brutal flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{getInitials(profile.display_name || "")}</span>
              )}
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-start sm:justify-end">
              {!isOwnProfile && (
                <>
                  {!isConnected && connectionStatus !== "pending" && (
                    <button
                      onClick={handleConnect}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs border-2 border-slate-900 shadow-brutal-sm hover:shadow-brutal transition-all"
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-900 border-2 border-slate-900 rounded-xl text-xs font-bold shadow-brutal-sm hover:bg-slate-50 transition-all"
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-900 border-2 border-slate-900 rounded-xl text-xs font-bold shadow-brutal-sm hover:bg-slate-50 transition-all"
                  >
                    <Share2 className="w-4 h-4 text-slate-600" /> Share
                  </button>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs border-2 border-slate-900 shadow-brutal-sm hover:shadow-brutal transition-all"
                  >
                    <Pencil className="w-4 h-4" /> Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Core Identity */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900">{profile.display_name}</h1>
              {profile.username && (
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  @{profile.username}
                </span>
              )}
            </div>
            {profile.headline && (
              <p className="text-slate-700 text-sm font-medium leading-relaxed">{profile.headline}</p>
            )}

            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-xs text-slate-600 font-semibold">
              {(profile.job_title || profile.current_company) && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {profile.job_title}{profile.job_title && profile.current_company ? " at " : ""}{profile.current_company}
                </span>
              )}
              {(profile.location || profile.country) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {[profile.location, profile.country].filter(Boolean).join(", ")}
                </span>
              )}
              {profile.experience_years != null && profile.experience_years > 0 && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {profile.experience_years}+ yrs experience
                </span>
              )}
              {profile.connection_count !== undefined && (
                <span className="font-bold text-slate-900">{profile.connection_count} connections</span>
              )}
              {profile.follower_count !== undefined && (
                <span className="font-bold text-slate-900">{profile.follower_count} followers</span>
              )}
              {!isOwnProfile && mutualCount > 0 && (
                <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  <Users className="w-3 h-3" /> {mutualCount} mutual connection{mutualCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {profile.is_open_to_work && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-900 text-xs font-bold rounded-lg border-2 border-slate-900 shadow-brutal-sm">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Open to {profile.open_to_work_types?.join(", ") || "opportunities"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Completeness Card (own profile only) */}
      {isOwnProfile && completeness && completeness.percentage < 100 && (
        <section className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-slate-900 rounded-2xl p-6 shadow-brutal-sm">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-black text-slate-900">Profile Completeness: {completeness.percentage}%</h2>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Complete Profile →
            </button>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full border border-slate-400 overflow-hidden mb-3">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${completeness.percentage}%` }}
            />
          </div>
          {completeness.missingItems.length > 0 && (
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Suggested additions:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                {completeness.missingItems.slice(0, 3).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* About */}
      {profile.bio && (
        <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-brutal-sm">
          <h2 className="text-base font-black text-slate-900 mb-3">About</h2>
          <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
        </section>
      )}

      {/* Experience Timeline */}
      <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-brutal-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-black text-slate-900">Experience</h2>
          </div>
          {isOwnProfile && (
            <button onClick={() => setShowEditModal(true)} className="text-xs font-bold text-blue-600 hover:underline">
              + Add Experience
            </button>
          )}
        </div>

        {experiences.length === 0 ? (
          <p className="text-slate-400 text-xs font-medium">No experience history added yet.</p>
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
      </section>

      {/* Education */}
      <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-brutal-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-black text-slate-900">Education</h2>
          </div>
          {isOwnProfile && (
            <button onClick={() => setShowEditModal(true)} className="text-xs font-bold text-blue-600 hover:underline">
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
      </section>

      {/* Projects Showcase */}
      <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-brutal-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-black text-slate-900">Projects &amp; Technical Work</h2>
          </div>
          {isOwnProfile && (
            <button onClick={() => setShowEditModal(true)} className="text-xs font-bold text-blue-600 hover:underline">
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
                    <div className="flex items-center gap-2">
                      {proj.github_url && (
                        <a href={proj.github_url} target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  {proj.description && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">{proj.description}</p>
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
      </section>

      {/* Skills */}
      <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-brutal-sm">
        <h2 className="text-base font-black text-slate-900 mb-4">Skills &amp; Methodologies</h2>
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
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-slate-900 border-2 border-slate-900 rounded-lg text-xs font-bold shadow-brutal-sm"
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
      </section>

      {/* Certifications & Achievements */}
      {(certifications.length > 0 || achievements.length > 0) && (
        <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-brutal-sm space-y-4">
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
        </section>
      )}

      {/* Interests */}
      {(profile.interests || []).length > 0 && (
        <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-brutal-sm">
          <h2 className="text-base font-black text-slate-900 mb-4">Research &amp; Engineering Interests</h2>
          <div className="flex flex-wrap gap-2">
            {(profile.interests || []).map((interest) => (
              <span
                key={interest}
                className="px-3 py-1 bg-slate-50 text-slate-800 border-2 border-slate-900 rounded-lg text-xs font-bold shadow-brutal-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Profile links */}
      {(profile.linkedin_url || profile.github_url || profile.website_url) && (
        <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-brutal-sm">
          <h2 className="text-base font-black text-slate-900 mb-4">Verified Links</h2>
          <div className="flex flex-wrap gap-3 text-xs font-bold">
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-slate-900 rounded-lg text-slate-900 hover:bg-blue-50 shadow-brutal-sm transition-all"
              >
                LinkedIn ↗
              </a>
            )}
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-slate-900 rounded-lg text-slate-900 hover:bg-slate-50 shadow-brutal-sm transition-all"
              >
                GitHub ↗
              </a>
            )}
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-slate-900 rounded-lg text-slate-900 hover:bg-slate-50 shadow-brutal-sm transition-all"
              >
                Portfolio ↗
              </a>
            )}
          </div>
        </section>
      )}

      {/* Recommendations */}
      <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-brutal-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-slate-900">Recommendations ({recommendations.length})</h2>
          {!isOwnProfile && isConnected && (
            <button onClick={() => setShowRecommendModal(true)} className="flex items-center gap-1 text-blue-600 text-xs font-bold hover:underline">
              <Star className="w-3.5 h-3.5" /> Write recommendation
            </button>
          )}
        </div>
        {recommendations.length === 0 ? (
          <p className="text-slate-400 text-xs font-medium">No recommendations yet.</p>
        ) : (
          <div className="space-y-3">
            {recommendations.filter((r) => r.is_visible || isOwnProfile).map((rec) => (
              <div key={rec.id} className="bg-slate-50 rounded-xl p-4 border-2 border-slate-900 shadow-brutal-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border-2 border-slate-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 text-xs font-bold">{getInitials(rec.author?.display_name || "")}</span>
                  </div>
                  <div>
                    <p className="text-slate-900 text-xs font-bold">{rec.author?.display_name}</p>
                    {rec.relationship && <p className="text-slate-500 text-[11px] font-medium">{rec.relationship}</p>}
                    <p className="text-slate-700 text-xs font-medium mt-1.5 leading-relaxed">{rec.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recommend Modal */}
      {showRecommendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowRecommendModal(false)}>
          <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 w-full max-w-md shadow-brutal-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-black text-slate-900 mb-4">Write a Recommendation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-800 text-xs font-bold mb-1">Your relationship</label>
                <input
                  value={recRelationship}
                  onChange={(e) => setRecRelationship(e.target.value)}
                  placeholder="Worked together at DRDO, PhD supervisor..."
                  className="w-full bg-white border-2 border-slate-900 text-slate-900 text-xs font-medium rounded-xl px-3 py-2.5 shadow-brutal-sm focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-slate-800 text-xs font-bold mb-1">Recommendation</label>
                <textarea
                  value={recContent}
                  onChange={(e) => setRecContent(e.target.value)}
                  rows={4}
                  placeholder="What's it like working with this person?"
                  className="w-full bg-white border-2 border-slate-900 text-slate-900 text-xs font-medium rounded-xl px-3 py-2.5 shadow-brutal-sm focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowRecommendModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900">Cancel</button>
                <button
                  onClick={handleSubmitRecommendation}
                  disabled={!recContent || submitting}
                  className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-4 py-2 text-xs font-bold border-2 border-slate-900 shadow-brutal-sm hover:shadow-brutal disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Recommendation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal (own profile only) */}
      {showEditModal && profile && (
        <EditProfileModal
          userId={profile.id}
          profile={profile}
          initialExperiences={experiences}
          initialEducations={educations}
          initialProjects={projects}
          initialCertifications={certifications}
          initialAchievements={achievements}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setProfile({ ...profile, ...updated } as UserProfile);
            // Refresh sub-resources
            api.get<any>(`/api/profile/${profile.username || profile.id}`).then((res) => {
              if (res?.experiences) setExperiences(res.experiences);
              if (res?.educations) setEducations(res.educations);
              if (res?.projects) setProjects(res.projects);
              if (res?.certifications) setCertifications(res.certifications);
              if (res?.achievements) setAchievements(res.achievements);
              if (res?.completeness) setCompleteness(res.completeness);
            }).catch(() => {});
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}
