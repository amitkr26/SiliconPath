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
        <h1 className="text-2xl font-bold text-text-primary">Profile Not Found</h1>
        <p className="text-text-secondary mt-2">This user hasn&apos;t set up their profile yet.</p>
        <Link href={notFoundBackHref} className="text-accent text-sm mt-4 inline-block hover:underline">
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="h-48 sm:h-56 rounded-xl bg-gradient-to-r from-accent/30 via-accent/20 to-accent/5 mb-16 relative overflow-hidden" />

      {/* Header */}
      <div className="relative -mt-24 mb-8 flex flex-col sm:flex-row items-start sm:items-end gap-4 px-4">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-surface border-4 border-bg-primary overflow-hidden flex items-center justify-center bg-gradient-to-br from-accent/30 to-accent/5 flex-shrink-0">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-accent">{getInitials(profile.display_name || "")}</span>
          )}
        </div>
        <div className="flex-1 min-w-0 pt-2 sm:pt-0">
          <h1 className="text-2xl font-bold text-text-primary">{profile.display_name}</h1>
          {profile.headline && <p className="text-text-secondary text-sm mt-0.5">{profile.headline}</p>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary">
            {(profile.job_title || profile.current_company) && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {profile.job_title}{profile.job_title && profile.current_company ? " at " : ""}{profile.current_company}
              </span>
            )}
            {(profile.location || profile.country) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {[profile.location, profile.country].filter(Boolean).join(", ")}
              </span>
            )}
            {profile.experience_years != null && profile.experience_years > 0 && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {profile.experience_years}+ years experience
              </span>
            )}
            {profile.connection_count !== undefined && <span>{profile.connection_count} connections</span>}
            {profile.follower_count !== undefined && <span>{profile.follower_count} followers</span>}
          </div>
          {profile.is_open_to_work && (
            <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-success/20 text-success text-xs font-medium rounded-full border border-success/30">
              <Check className="w-3 h-3" /> Open to {profile.open_to_work_types?.join(", ") || "work"}
            </span>
          )}
        </div>
        {!isOwnProfile && (
          <div className="flex gap-2 flex-shrink-0">
            {!isConnected && connectionStatus !== "pending" && (
              <button onClick={handleConnect} className="flex items-center gap-2 bg-accent text-bg-primary font-semibold rounded-lg px-4 py-2 text-sm hover:bg-accent-hover transition-colors">
                <UserPlus className="w-4 h-4" /> Connect
              </button>
            )}
            {connectionStatus === "pending" && (
              <span className="flex items-center gap-2 bg-warning/20 text-warning rounded-lg px-4 py-2 text-sm font-medium">
                <UserCheck className="w-4 h-4" /> Pending
              </span>
            )}
            {isConnected && (
              <Link href="/messages" className="flex items-center gap-2 bg-surface border border-border text-text-secondary rounded-lg px-4 py-2 text-sm hover:text-text-primary transition-colors">
                <MessageCircle className="w-4 h-4" /> Message
              </Link>
            )}
            <button onClick={handleFollow} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isFollowing
                ? "bg-surface border border-border text-text-secondary hover:text-danger"
                : "bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30"
            }`}>
              {isFollowing ? "Following" : "Follow"}
            </button>
          </div>
        )}
        {isOwnProfile && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-surface border border-border text-text-secondary rounded-lg px-4 py-2 text-sm hover:text-text-primary transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share Profile
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 bg-accent text-bg-primary font-semibold rounded-lg px-4 py-2 text-sm hover:bg-accent-hover transition-colors"
            >
              <Pencil className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* About */}
      {profile.bio && (
        <section className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-text-primary mb-3">About</h2>
          <p className="text-text-secondary text-sm whitespace-pre-wrap">{profile.bio}</p>
        </section>
      )}

      {/* Skills */}
      <section className="bg-surface border border-border rounded-xl p-6 mb-6">
        <h2 className="font-display text-lg font-bold text-text-primary mb-4">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {(profile.skills || []).length === 0 ? (
            <p className="text-text-muted text-sm">No skills added yet.</p>
          ) : (
            (profile.skills || []).map((skill) => {
              const count = endorsedSkills.get(skill) || 0;
              return (
                <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-xs font-medium">
                  {skill}
                  {count > 0 && <span className="text-text-secondary text-[10px]">· {count}</span>}
                  {!isOwnProfile && isConnected && (
                    <button onClick={() => handleEndorse(skill)} className="text-text-muted hover:text-accent transition-colors ml-0.5" title="Endorse">
                      <Star className="w-3 h-3" />
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
        <section className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-text-primary mb-4">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {(profile.interests || []).map((interest) => (
              <span key={interest} className="px-3 py-1.5 bg-bg-primary border border-border rounded-full text-xs font-medium text-text-secondary">
                {interest}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Profile links */}
      {(profile.linkedin_url || profile.github_url || profile.website_url) && (
        <section className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-text-primary mb-4">Links</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                LinkedIn ↗
              </a>
            )}
            {profile.github_url && (
              <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                GitHub ↗
              </a>
            )}
            {profile.website_url && (
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                Website ↗
              </a>
            )}
          </div>
        </section>
      )}

      {/* Recommendations */}
      <section className="bg-surface border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-text-primary">Recommendations ({recommendations.length})</h2>
          {!isOwnProfile && isConnected && (
            <button onClick={() => setShowRecommendModal(true)} className="flex items-center gap-1 text-accent text-sm font-medium hover:underline">
              <Star className="w-4 h-4" /> Write a recommendation
            </button>
          )}
        </div>
        {recommendations.length === 0 ? (
          <p className="text-text-muted text-sm">No recommendations yet.</p>
        ) : (
          <div className="space-y-4">
            {recommendations.filter((r) => r.is_visible || isOwnProfile).map((rec) => (
              <div key={rec.id} className="bg-bg-primary rounded-lg p-4 border border-border/50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent text-xs font-bold">{getInitials(rec.author?.display_name || "")}</span>
                  </div>
                  <div>
                    <p className="text-text-primary text-sm font-medium">{rec.author?.display_name}</p>
                    {rec.relationship && <p className="text-text-muted text-xs">{rec.relationship}</p>}
                    <p className="text-text-secondary text-sm mt-2">{rec.content}</p>
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
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-text-primary mb-4">Write a Recommendation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-text-secondary text-xs font-medium mb-1">Your relationship</label>
                <input
                  value={recRelationship}
                  onChange={(e) => setRecRelationship(e.target.value)}
                  placeholder="Worked together at DRDO, PhD supervisor..."
                  className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-accent focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-xs font-medium mb-1">Recommendation</label>
                <textarea
                  value={recContent}
                  onChange={(e) => setRecContent(e.target.value)}
                  rows={4}
                  placeholder="What's it like working with this person?"
                  className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-accent focus:border-accent outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowRecommendModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">Cancel</button>
                <button onClick={handleSubmitRecommendation} disabled={!recContent || submitting} className="flex items-center gap-2 bg-accent text-bg-primary rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent-hover disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
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
