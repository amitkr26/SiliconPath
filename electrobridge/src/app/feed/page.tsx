"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Send, ThumbsUp, MessageCircle, Repeat2, Trash2, Users, Briefcase,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Author {
  id?: string;
  display_name?: string | null;
  headline?: string | null;
  avatar_url?: string | null;
}

interface Post {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  like_count?: number;
  comment_count?: number;
  user_reaction?: string | null;
  author?: Author | null;
}

interface Opp {
  id: string;
  slug?: string;
  title: string;
  organizations?: { name?: string } | null;
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString();
}

export default function FeedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [opps, setOpps] = useState<Opp[]>([]);

  const loadFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/feed?limit=20");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadOpps = useCallback(async () => {
    try {
      const res = await fetch("/api/opportunities?limit=4");
      if (res.ok) {
        const data = await res.json();
        setOpps((data.opportunities || []).slice(0, 4));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) {
        router.push("/login?redirectTo=/feed");
        return;
      }
      setUserId(data.user.id);
      const { data: prof } = await supabase
        .from("user_profiles")
        .select("display_name, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();
      setDisplayName(prof?.display_name || data.user.email || "You");
      setLoading(false);
    });
    loadFeed();
    loadOpps();
  }, [router, loadFeed, loadOpps]);

  const createPost = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setContent("");
        toast.success("Posted!");
        loadFeed();
      } else {
        toast.error("Failed to post");
      }
    } catch {
      toast.error("Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  const like = async (postId: string) => {
    try {
      const res = await fetch(`/api/feed/posts/${postId}/like`, { method: "POST" });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            const liked = !!p.user_reaction;
            return {
              ...p,
              like_count: liked ? (p.like_count || 1) - 1 : (p.like_count || 0) + 1,
              user_reaction: liked ? null : "like",
            };
          })
        );
      }
    } catch {
      /* ignore */
    }
  };

  const remove = async (postId: string) => {
    try {
      const res = await fetch(`/api/feed/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        toast.success("Deleted");
      }
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Main column */}
        <div className="space-y-4 min-w-0">
          {/* Composer */}
          <div className="bg-bg-secondary border border-border rounded-xl p-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
                {initials(displayName)}
              </div>
              <div className="flex-1 min-w-0">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share something with your network..."
                  rows={2}
                  className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={createPost}
                    disabled={submitting || !content.trim()}
                    className="inline-flex items-center gap-1.5 bg-accent text-white text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="bg-bg-secondary border border-border rounded-xl p-10 text-center">
              <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-primary font-medium">No posts yet</p>
              <p className="text-text-secondary text-sm mt-1">
                Connect with people to see their posts here.
              </p>
              <Link href="/network" className="inline-block mt-4 text-accent text-sm font-medium">
                Find people to follow
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-bg-secondary border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {initials(post.author?.display_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {post.author?.display_name || "Member"}
                        </p>
                        <p className="text-xs text-text-muted">{timeAgo(post.created_at)}</p>
                      </div>
                    </div>
                    {post.author_id === userId && (
                      <button
                        onClick={() => remove(post.id)}
                        className="text-text-muted hover:text-danger transition-colors"
                        aria-label="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-text-primary mt-3 whitespace-pre-wrap break-words">
                    {post.content}
                  </p>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => like(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        post.user_reaction
                          ? "bg-accent/15 text-accent"
                          : "text-text-secondary hover:bg-bg-primary hover:text-text-primary"
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" /> {post.like_count || 0}
                    </button>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary">
                      <MessageCircle className="w-4 h-4" /> {post.comment_count || 0}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary">
                      <Repeat2 className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-4">
          <div className="bg-bg-secondary border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-accent" /> Latest Opportunities
            </h3>
            <div className="space-y-3">
              {opps.length === 0 && <p className="text-xs text-text-muted">No opportunities yet</p>}
              {opps.map((o) => (
                <Link
                  key={o.id}
                  href={o.slug ? `/opportunities/${o.slug}` : "/opportunities"}
                  className="block group"
                >
                  <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors line-clamp-2">
                    {o.title}
                  </p>
                  <p className="text-xs text-text-muted">{o.organizations?.name || ""}</p>
                </Link>
              ))}
            </div>
            <Link href="/opportunities" className="inline-block mt-3 text-xs text-accent font-medium">
              View all
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
