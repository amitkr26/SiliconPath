"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Image, Send, Heart, MessageCircle, Repeat2,
  MoreHorizontal, Bookmark, Trash2, ThumbsUp, PartyPopper,
  Lightbulb, Sparkles, Users, Building2, TrendingUp,
  Briefcase, UserPlus, UserCheck, AlertCircle, X, ChevronDown
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { FeedPost, UserProfile } from "@/types";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

const REACTIONS = [
  { key: "like", icon: ThumbsUp, label: "Like", color: "text-accent" },
  { key: "celebrate", icon: PartyPopper, label: "Celebrate", color: "text-success" },
  { key: "support", icon: Heart, label: "Support", color: "text-danger" },
  { key: "insightful", icon: Lightbulb, label: "Insightful", color: "text-warning" },
  { key: "curious", icon: Sparkles, label: "Curious", color: "text-purple-400" },
];

const POST_TYPES = [
  { key: "post", label: "Post" },
  { key: "article", label: "Article" },
  { key: "achievement", label: "Achievement" },
  { key: "question", label: "Question" },
];

export default function FeedPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState("post");
  const [submitting, setSubmitting] = useState(false);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);

  const loadFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/feed?limit=20");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) { router.push("/login"); return; }
      setUser(data.user);

      const { data: prof } = await supabase
        .from("user_profiles")
        .select("full_name, username, avatar_url, headline, connection_count, following_count, follower_count")
        .eq("id", data.user.id)
        .single();
      if (prof) {
        setProfile(prof);
        setConnectionCount(prof.connection_count || 0);
        setFollowingCount(prof.following_count || 0);
        setFollowerCount(prof.follower_count || 0);
      }
      setLoading(false);
    });
    loadFeed();
    loadSuggestions();
    loadCompanies();
    loadOpportunities();
  }, [router, loadFeed]);

  const loadSuggestions = async () => {
    try {
      const res = await fetch("/api/network/suggestions?limit=5");
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch {}
  };

  const loadCompanies = async () => {
    try {
      const res = await fetch("/api/companies?limit=5&sort=followers");
      if (res.ok) {
        const data = await res.json();
        setCompanies((data.companies || data).slice(0, 5));
      }
    } catch {}
  };

  const loadOpportunities = async () => {
    try {
      const res = await fetch("/api/opportunities?limit=3");
      if (res.ok) {
        const data = await res.json();
        setOpportunities((data.opportunities || []).slice(0, 3));
      }
    } catch {}
  };

  const loadComments = async (postId: string) => {
    try {
      const res = await fetch(`/api/feed/posts/${postId}/comment`);
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => ({ ...prev, [postId]: data.comments || [] }));
      }
    } catch {}
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: postContent, post_type: postType }),
      });
      if (res.ok) {
        setPostContent("");
        setPostType("post");
        toast.success("Posted!");
        loadFeed();
      } else {
        toast.error("Failed to post");
      }
    } catch {
      toast.error("Failed to post");
    }
    setSubmitting(false);
  };

  const handleLike = async (postId: string, reaction = "like") => {
    const res = await fetch(`/api/feed/posts/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction }),
    });
    if (res.ok) {
      setPosts((prev) => prev.map((p) => {
        if (p.id === postId) {
          const wasLiked = p.user_reaction;
          return {
            ...p,
            likes_count: wasLiked ? (p.likes_count || 1) - 1 : (p.likes_count || 0) + 1,
            user_reaction: wasLiked ? null : reaction,
          };
        }
        return p;
      }));
    }
    setShowReactionPicker(null);
  };

  const handleComment = async (postId: string) => {
    const content = commentInput[postId]?.trim();
    if (!content) return;
    const res = await fetch(`/api/feed/posts/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      setCommentInput((prev) => ({ ...prev, [postId]: "" }));
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
      ));
      loadComments(postId);
      toast.success("Comment added!");
    }
  };

  const handleRepost = async (postId: string) => {
    const res = await fetch(`/api/feed/posts/${postId}/repost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? {
          ...p,
          reposts_count: (p.reposts_count || 0) + (data.reposted ? 1 : -1),
          has_reposted: data.reposted,
        } : p
      ));
      toast.success(data.reposted ? "Reposted!" : "Removed repost");
    }
  };

  const handleDeletePost = async (postId: string) => {
    const res = await fetch(`/api/feed/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post deleted");
    }
  };

  const getReactionIcon = (reaction: string | null | undefined) => {
    if (!reaction) return null;
    const r = REACTIONS.find((r) => r.key === reaction);
    if (!r) return null;
    const Icon = r.icon;
    return <Icon className={`w-4 h-4 ${r.color}`} />;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex gap-6">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-[240px] flex-shrink-0">
          <div className="bg-surface border border-border rounded-xl overflow-hidden mb-4">
            <div className="h-16 bg-gradient-to-r from-accent/30 to-accent/10" />
            <div className="px-4 pb-4 -mt-8">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-bg-primary flex items-center justify-center mx-auto mb-2">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-accent">{getInitials(profile.full_name || "")}</span>
                )}
              </div>
              <Link href="/profile" className="block text-center">
                <p className="text-text-primary text-sm font-medium hover:text-accent">{profile.full_name || "User"}</p>
              </Link>
              {profile.headline && (
                <p className="text-text-muted text-xs text-center mt-0.5 line-clamp-2">{profile.headline}</p>
              )}
              <div className="flex justify-center gap-4 mt-3 text-xs">
                <Link href="/network?tab=connections" className="text-center hover:text-accent">
                  <p className="font-bold text-text-primary">{connectionCount}</p>
                  <p className="text-text-muted">Connections</p>
                </Link>
                <Link href="/network?tab=followers" className="text-center hover:text-accent">
                  <p className="font-bold text-text-primary">{followerCount}</p>
                  <p className="text-text-muted">Followers</p>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 mb-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">My Network</h3>
            <div className="space-y-1">
              <Link href="/network?tab=connections" className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors">
                <Users className="w-4 h-4" /> Connections
              </Link>
              <Link href="/network?tab=following" className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors">
                <UserPlus className="w-4 h-4" /> Following
              </Link>
              <Link href="/network?tab=followers" className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors">
                <Users className="w-4 h-4" /> Followers
              </Link>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">My Items</h3>
            <div className="space-y-1">
              <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors">
                <Bookmark className="w-4 h-4" /> Saved Jobs
              </Link>
              <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors">
                <Briefcase className="w-4 h-4" /> Applications
              </Link>
              <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors">
                <AlertCircle className="w-4 h-4" /> Alerts
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Feed */}
        <div className="flex-1 min-w-0 max-w-2xl">
          {/* Create Post */}
          <div className="bg-surface border border-border rounded-xl p-4 mb-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center flex-shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-accent">{getInitials(profile.full_name || "")}</span>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share something with your network..."
                  rows={2}
                  className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-1">
                    {POST_TYPES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setPostType(t.key)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          postType === t.key
                            ? "bg-accent/20 text-accent"
                            : "text-text-secondary hover:text-text-primary hover:bg-bg-primary"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleCreatePost}
                    disabled={!postContent.trim() || submitting}
                    className="flex items-center gap-1.5 bg-accent text-bg-primary rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <p className="text-text-secondary">No posts in your feed yet.</p>
              <p className="text-text-muted text-sm mt-1">Connect with people and follow companies to see their posts here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const p = post.user_profile;
                return (
                  <div key={post.id} className="bg-surface border border-border rounded-xl p-4">
                    {/* Post Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <Link href={`/people/${p?.username || ""}`} className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center">
                            {p?.avatar_url ? (
                              <img src={p.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-accent">{getInitials(p?.full_name || "")}</span>
                            )}
                          </div>
                        </Link>
                        <div>
                          <Link href={`/people/${p?.username || ""}`} className="text-text-primary text-sm font-medium hover:text-accent">
                            {p?.full_name || "Unknown"}
                          </Link>
                          {p?.headline && <p className="text-text-muted text-xs">{p.headline}</p>}
                          <p className="text-text-muted text-[10px] mt-0.5">{timeAgo(post.created_at)}</p>
                        </div>
                      </div>
                      {post.user_id === user?.id && (
                        <button onClick={() => handleDeletePost(post.id)} className="text-text-muted hover:text-danger transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Post Content */}
                    {post.post_type === "achievement" && (
                      <div className="flex items-center gap-2 mb-2">
                        <PartyPopper className="w-4 h-4 text-warning" />
                        <span className="text-xs font-medium text-warning">Achievement</span>
                      </div>
                    )}
                    {post.post_type === "question" && (
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-accent" />
                        <span className="text-xs font-medium text-accent">Question</span>
                      </div>
                    )}
                    <p className="text-text-primary text-sm whitespace-pre-wrap mb-3">{post.content}</p>

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-accent/10 text-accent rounded text-[10px]">#{tag}</span>
                        ))}
                      </div>
                    )}

                    {/* Post Stats */}
                    <div className="flex items-center gap-4 text-text-muted text-xs mb-2 pb-2 border-b border-border/50">
                      {post.likes_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-danger" />
                          {post.likes_count}
                        </span>
                      )}
                      {post.comments_count > 0 && (
                        <button onClick={() => { setExpandedComments({ ...expandedComments, [post.id]: !expandedComments[post.id] }); if (!expandedComments[post.id]) loadComments(post.id); }} className="hover:text-text-primary">
                          {post.comments_count} comments
                        </button>
                      )}
                      {post.reposts_count > 0 && <span>{post.reposts_count} reposts</span>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <div className="relative">
                        <button
                          onClick={() => handleLike(post.id)}
                          onMouseEnter={() => setShowReactionPicker(post.id)}
                          onMouseLeave={() => setShowReactionPicker(null)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            post.user_reaction
                              ? "bg-accent/15 text-accent"
                              : "text-text-secondary hover:bg-bg-primary hover:text-text-primary"
                          }`}
                        >
                          {getReactionIcon(post.user_reaction) || <Heart className="w-4 h-4" />}
                          {post.user_reaction ? REACTIONS.find((r) => r.key === post.user_reaction)?.label || "Liked" : "Like"}
                        </button>
                        {showReactionPicker === post.id && (
                          <div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-surface border border-border rounded-xl p-1.5 shadow-xl z-10"
                            onMouseEnter={() => setShowReactionPicker(post.id)}
                            onMouseLeave={() => setShowReactionPicker(null)}>
                            {REACTIONS.map((r) => {
                              const Icon = r.icon;
                              return (
                                <button
                                  key={r.key}
                                  onClick={() => handleLike(post.id, r.key)}
                                  className={`p-1.5 rounded-lg hover:bg-bg-primary transition-colors ${r.color}`}
                                  title={r.label}
                                >
                                  <Icon className="w-5 h-5" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => { setExpandedComments({ ...expandedComments, [post.id]: !expandedComments[post.id] }); if (!expandedComments[post.id]) loadComments(post.id); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-bg-primary hover:text-text-primary transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" /> Comment
                      </button>
                      <button
                        onClick={() => handleRepost(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          post.has_reposted
                            ? "bg-success/15 text-success"
                            : "text-text-secondary hover:bg-bg-primary hover:text-text-primary"
                        }`}
                      >
                        <Repeat2 className="w-4 h-4" /> Repost
                      </button>
                    </div>

                    {/* Comments Section */}
                    {expandedComments[post.id] && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        {/* Existing Comments */}
                        {(comments[post.id] || []).map((c: any) => (
                          <div key={c.id} className="flex gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-[8px] font-bold text-accent">{getInitials(c.user_profile?.full_name || "")}</span>
                            </div>
                            <div className="bg-bg-primary rounded-lg px-3 py-1.5 flex-1">
                              <p className="text-xs font-medium text-text-primary">{c.user_profile?.full_name}</p>
                              <p className="text-xs text-text-secondary">{c.content}</p>
                            </div>
                          </div>
                        ))}
                        {/* Comment Input */}
                        <div className="flex gap-2 mt-2">
                          <input
                            value={commentInput[post.id] || ""}
                            onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                            placeholder="Write a comment..."
                            className="flex-1 bg-bg-primary border border-border text-text-primary text-xs rounded-lg px-3 py-1.5 focus:ring-accent focus:border-accent outline-none"
                          />
                          <button
                            onClick={() => handleComment(post.id)}
                            disabled={!commentInput[post.id]?.trim()}
                            className="text-accent hover:text-accent-hover disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-[280px] flex-shrink-0">
          {/* People You May Know */}
          <div className="bg-surface border border-border rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">People You May Know</h3>
            <div className="space-y-3">
              {suggestions.slice(0, 4).map((s: any) => (
                <div key={s.id} className="flex items-start gap-2">
                  <Link href={`/people/${s.username || s.id}`}>
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-accent">{getInitials(s.full_name || "")}</span>
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/people/${s.username || s.id}`} className="text-xs font-medium text-text-primary hover:text-accent block truncate">
                      {s.full_name}
                    </Link>
                    {s.headline && <p className="text-[10px] text-text-muted truncate">{s.headline}</p>}
                  </div>
                  <button className="flex items-center gap-1 text-xs text-accent font-medium hover:underline flex-shrink-0">
                    <UserPlus className="w-3 h-3" /> Connect
                  </button>
                </div>
              ))}
              {suggestions.length === 0 && (
                <p className="text-text-muted text-xs">No suggestions yet</p>
              )}
            </div>
          </div>

          {/* Companies to Follow */}
          <div className="bg-surface border border-border rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Companies to Follow</h3>
            <div className="space-y-3">
              {companies.map((c: any) => (
                <div key={c.id} className="flex items-start gap-2">
                  <Link href={`/companies/${c.slug}`}>
                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-accent">{getInitials(c.name)}</span>
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/companies/${c.slug}`} className="text-xs font-medium text-text-primary hover:text-accent block truncate">
                      {c.name}
                    </Link>
                    <p className="text-[10px] text-text-muted">{c.follower_count || 0} followers</p>
                  </div>
                  <button className="flex items-center gap-1 text-xs text-accent font-medium hover:underline flex-shrink-0">
                    <Building2 className="w-3 h-3" /> Follow
                  </button>
                </div>
              ))}
              {companies.length === 0 && (
                <p className="text-text-muted text-xs">No companies yet</p>
              )}
            </div>
            <Link href="/companies" className="block text-center text-xs text-accent mt-2 hover:underline">See all →</Link>
          </div>

          {/* Latest Opportunities */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Latest Opportunities</h3>
            <div className="space-y-3">
              {opportunities.map((o: any) => (
                <Link key={o.id} href={`/opportunities/${o.slug}`} className="block p-2 rounded-lg hover:bg-bg-primary transition-colors">
                  <p className="text-xs font-medium text-text-primary line-clamp-1">{o.title}</p>
                  <p className="text-[10px] text-text-muted">{o.organization}</p>
                </Link>
              ))}
              {opportunities.length === 0 && (
                <p className="text-text-muted text-xs">No opportunities</p>
              )}
            </div>
            <Link href="/opportunities" className="block text-center text-xs text-accent mt-2 hover:underline">View all →</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
