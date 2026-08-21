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
  UserCheck, Pencil, Share2, Star, Send
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import type { UserProfile, SkillEndorsement, Recommendation } from "@/types";
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
        let profileData: UserProfile | null;
        if (!currentUser && initialProfile) {
          profileData = initialProfile; // server-rendered logged-out view
        } else {
          profileData = await api.get<UserProfile>(`/api/profile/${username}`);
        }
        if (!profileData) { setLoading(false); return; }
        setProfile(profileData);

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
    // Each call is isolated so a failure in one never blocks the others
    // (e.g. endorsements/recommendations must still load).
    try {
      const conn = await api.get<any>("/api/network/connections", {
        params: { myId, theirId },
      });
      if (conn?.status) {
        setConnectionStatus(conn.status);
        if (conn.status === "accepted") setIsConnected(true);
      }
    } catch {
      // relationship state unavailable — buttons default to Connect/Follow
    }

    try {
      const follow = await api.get<{ following: boolean }>(`/api/network/follow/${theirId}`);
      setIsFollowing(!!follow?.following);
    } catch {
      // follow state unavailable — button defaults to Follow
    }
  };

  const loadEndorsements = async (userId: string) => {
    const data = await api.get<{ endorsements: SkillEndorsement[] }>(`/api/profile/${userId}/endorse`);
    setEndorsements(data.endorsements || []);
  };

  const loadRecommendations = async (userId: string) => {
    const data = await api.get<{ recommendations: Recommendation[] }>(`/api/profile/${userId}/recommendations`);
    setRecommendations(data.recommendations || []);
  };

  const handleEndorse = async (skill: string) => {
    if (!profile || !currentUser) return;
    try {
      await api.post(`/api/profile/${profile.id}/endorse`, { skill });
      toast.success(`Endorsed ${skill}!`);
      loadEndorsements(profile.id);
    } catch (err: any) {
      toast.error(err?.body?.error || "Failed to endorse");
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
        // A request already exists — reflect the REAL relationship state.
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
          setIsFollowing(true); // already following — keep the UI truthful
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
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
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
      <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-brutal overflow-hidden">
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
                  {isConnected && (
                    <Link
                      href="/messages"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-900 border-2 border-slate-900 rounded-xl text-xs font-bold shadow-brutal-sm hover:bg-slate-50 transition-all"
                    >
                      <MessageCircle className="w-4 h-4 text-blue-600" /> Message
                    </Link>
                  )}
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
            </div>

            {profile.is_open_to_work && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-900 text-xs font-bold rounded-lg border-2 border-slate-900 shadow-brutal-sm">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Open to {profile.open_to_work_types?.join(", ") || "work"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* About */}
      {profile.bio && (
        <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-brutal-sm">
          <h2 className="text-base font-black text-slate-900 mb-3">About</h2>
          <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
        </section>
      )}

      {/* Skills */}
      <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-brutal-sm">
        <h2 className="text-base font-black text-slate-900 mb-4">Skills &amp; Methodologies</h2>
        <div className="flex flex-wrap gap-2">
          {(profile.skills || []).length === 0 ? (
            <p className="text-slate-400 text-xs font-medium">No skills added yet.</p>
          ) : (
            (profile.skills || []).map((skill) => {
              const count = endorsedSkills.get(skill) || 0;
              return (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-slate-900 border-2 border-slate-900 rounded-lg text-xs font-bold shadow-brutal-sm"
                >
                  {skill}
                  {count > 0 && <span className="text-blue-700 font-black text-[10px]">· {count}</span>}
                  {!isOwnProfile && isConnected && (
                    <button onClick={() => handleEndorse(skill)} className="text-slate-400 hover:text-amber-500 transition-colors ml-0.5" title="Endorse">
                      <Star className="w-3 h-3 fill-current" />
                    </button>
                  )}
                </span>
              );
            })
          )}
        </div>
      </section>

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
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setProfile({ ...profile, ...updated } as UserProfile);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}
