"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, MapPin, Briefcase, Check, MessageCircle, UserPlus,
  UserCheck, ExternalLink, GraduationCap, ThumbsUp, Star, Send
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { UserProfile, SkillEndorsement, Recommendation } from "@/types";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [endorsements, setEndorsements] = useState<SkillEndorsement[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [recContent, setRecContent] = useState("");
  const [recRelationship, setRecRelationship] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id);

      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (!profileData) { setLoading(false); return; }
      setProfile(profileData);

      if (data?.user && data.user.id !== profileData.id) {
        loadRelationship(supabase, data.user.id, profileData.id);
      }
      loadEndorsements(profileData.id);
      loadRecommendations(profileData.id);
      setLoading(false);
    });
  }, [username, router]);

  const loadRelationship = async (supabase: any, myId: string, theirId: string) => {
    const { data: conn } = await supabase.from("connections").select("*")
      .or(`user_id_1.eq.${myId},user_id_2.eq.${myId}`)
      .or(`user_id_1.eq.${theirId},user_id_2.eq.${theirId}`)
      .single().maybeSingle();
    if (conn) setIsConnected(true);

    const { data: follow } = await supabase.from("user_follows").select("*")
      .eq("follower_id", myId).eq("following_id", theirId).maybeSingle();
    if (follow) setIsFollowing(true);

    const { data: req } = await supabase.from("connection_requests").select("status")
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
      .or(`sender_id.eq.${theirId},receiver_id.eq.${theirId}`)
      .maybeSingle();
    if (req) setConnectionStatus(req.status);
  };

  const loadEndorsements = async (userId: string) => {
    const res = await fetch(`/api/profile/${userId}/endorse`);
    const data = await res.json();
    setEndorsements(data.endorsements || []);
  };

  const loadRecommendations = async (userId: string) => {
    const res = await fetch(`/api/profile/${userId}/recommendations`);
    const data = await res.json();
    setRecommendations(data.recommendations || []);
  };

  const handleEndorse = async (skill: string) => {
    if (!profile || !currentUserId) return;
    const res = await fetch(`/api/profile/${profile.id}/endorse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill }),
    });
    if (res.ok) {
      toast.success(`Endorsed ${skill}!`);
      loadEndorsements(profile.id);
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to endorse");
    }
  };

  const handleConnect = async () => {
    if (!profile || !currentUserId) return;
    const res = await fetch("/api/network/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: profile.id }),
    });
    if (res.ok) {
      toast.success("Connection request sent!");
      setConnectionStatus("pending");
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to send request");
    }
  };

  const handleFollow = async () => {
    if (!profile || !currentUserId) return;
    if (isFollowing) {
      await fetch(`/api/network/follow/${profile.id}`, { method: "DELETE" });
      setIsFollowing(false);
      toast.success("Unfollowed");
    } else {
      await fetch(`/api/network/follow/${profile.id}`, { method: "POST" });
      setIsFollowing(true);
      toast.success("Following!");
    }
  };

  const handleSubmitRecommendation = async () => {
    if (!profile || !recContent) return;
    setSubmitting(true);
    const res = await fetch(`/api/profile/${profile.id}/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: recContent, relationship: recRelationship }),
    });
    if (res.ok) {
      toast.success("Recommendation sent!");
      setShowRecommendModal(false);
      setRecContent("");
      setRecRelationship("");
      loadRecommendations(profile.id);
    } else {
      toast.error("Failed to send recommendation");
    }
    setSubmitting(false);
  };

  if (loading) {
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
        <Link href="/feed" className="text-accent text-sm mt-4 inline-block hover:underline">Back to Feed</Link>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.id;
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
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-accent">{getInitials(profile.full_name || "")}</span>
          )}
        </div>
        <div className="flex-1 min-w-0 pt-2 sm:pt-0">
          <h1 className="text-2xl font-bold text-text-primary">{profile.full_name}</h1>
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
      </div>

      {/* About */}
      {profile.about && (
        <section className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-text-primary mb-3">About</h2>
          <p className="text-text-secondary text-sm whitespace-pre-wrap">{profile.about}</p>
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
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                  )}
                </span>
              );
            })
          )}
        </div>
      </section>

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
    </div>
  );
}
