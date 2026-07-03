"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, Plus, MessageSquare, Heart, Share2, X, ArrowUp,
  Clock, TrendingUp, MessageCircle, Users, Hash, Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  upvotes: number;
  comment_count: number;
  created_at: string;
  user_id: string;
  user_profiles?: { full_name: string } | null;
}

const CATEGORIES = [
  { key: "all", label: "Trending", icon: TrendingUp },
  { key: "latest", label: "Latest", icon: Clock },
  { key: "discussion", label: "Top Discussions", icon: MessageCircle },
  { key: "qna", label: "Q&A", icon: Sparkles },
  { key: "showcase", label: "Showcase", icon: Heart },
];

const formatTimeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
};

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"latest" | "trending">("latest");
  const [user, setUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "general", tags: "" });
  const [posting, setPosting] = useState(false);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, limit: "20" });
      if (category !== "all" && category !== "latest") params.set("category", category);
      const res = await fetch(`/api/community/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {}
    setLoading(false);
  }, [category, sort]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/community/posts?limit=100`).then(r => r.json()).then(data => {
      const voted = new Set<string>();
      (data.posts || []).forEach((p: Post) => {});
    });
  }, [user]);

  const handleVote = async (postId: string) => {
    if (!user) { toast.error("Login to vote"); return; }
    try {
      await fetch("/api/community/vote", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post_id: postId }),
      });
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        upvotes: userVotes.has(postId) ? p.upvotes - 1 : p.upvotes + 1,
      } : p));
      setUserVotes(prev => {
        const n = new Set(prev);
        if (n.has(postId)) n.delete(postId); else n.add(postId);
        return n;
      });
    } catch {}
  };

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content) { toast.error("Title and content required"); return; }
    setPosting(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPost,
          tags: newPost.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        toast.success("Post created!");
        setShowModal(false);
        setNewPost({ title: "", content: "", category: "general", tags: "" });
        fetchPosts();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to post");
      }
    } catch { toast.error("Something went wrong"); }
    setPosting(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">Community</h1>
          <p className="text-text-secondary text-sm mt-1">Discuss, share, and connect with the semiconductor research community</p>
        </div>
        <button
          onClick={() => user ? setShowModal(true) : window.location.href = "/login"}
          className="flex items-center gap-2 bg-accent text-bg-primary rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Feed */}
        <div className="flex-1">
          {/* Category Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = category === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => { setCategory(cat.key); setSort(cat.key === "latest" ? "latest" : cat.key === "all" ? "trending" : "latest"); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive ? "bg-accent text-bg-primary" : "bg-surface text-text-secondary border border-border hover:text-text-primary"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Posts */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-surface border border-border rounded-xl">
              <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="font-display text-lg font-bold text-text-primary mb-2">Be the first to post!</h3>
              <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
                Share your experience with JRF applications, research tips, or ask the community a question.
              </p>
              <button
                onClick={() => user ? setShowModal(true) : window.location.href = "/login"}
                className="inline-flex items-center gap-2 bg-accent text-bg-primary rounded-lg px-6 py-3 text-sm font-medium hover:bg-accent-hover"
              >
                <Plus className="w-4 h-4" /> Start a Discussion
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <Link
                  key={post.id}
                  href={`/community/${post.id}`}
                  className="block bg-surface border border-border rounded-xl p-4 sm:p-5 hover:border-accent/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {/* Upvote */}
                    <button
                      onClick={(e) => { e.preventDefault(); handleVote(post.id); }}
                      className={`flex flex-col items-center gap-0.5 min-w-[40px] pt-1 ${
                        userVotes.has(post.id) ? "text-accent" : "text-text-muted hover:text-accent"
                      }`}
                    >
                      <ArrowUp className={`w-5 h-5 ${userVotes.has(post.id) ? "fill-accent" : ""}`} />
                      <span className="text-xs font-bold">{post.upvotes}</span>
                    </button>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-accent text-[10px] font-bold">
                            {getInitials(post.user_profiles?.full_name)}
                          </span>
                        </div>
                        <span className="text-text-secondary text-xs">
                          {post.user_profiles?.full_name || "Anonymous"}
                        </span>
                        <span className="text-text-muted text-xs">·</span>
                        <span className="text-text-muted text-xs">{formatTimeAgo(post.created_at)}</span>
                        <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-[10px] border border-accent/30">{post.category}</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-text-primary mb-1">{post.title}</h3>
                      <p className="text-text-secondary text-sm line-clamp-3">{post.content}</p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {post.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-accent/5 text-accent rounded text-[10px] border border-accent/20">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-text-muted text-xs">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {post.comment_count || 0} comments
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:w-[280px] space-y-4">
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="font-display text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              Top Contributors
            </h3>
            <p className="text-text-muted text-xs">Start posting to appear here!</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="font-display text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              <Hash className="w-4 h-4 text-accent" />
              Trending Tags
            </h3>
            <p className="text-text-muted text-xs">Tags will appear as the community grows.</p>
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-text-primary">New Post</h2>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-text-secondary text-xs font-medium mb-1">Title</label>
                <input value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} className="w-full bg-surface-elevated border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-accent focus:border-accent outline-none" />
              </div>
              <div>
                <label className="block text-text-secondary text-xs font-medium mb-1">Content</label>
                <textarea value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} rows={5} className="w-full bg-surface-elevated border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-accent focus:border-accent outline-none" />
              </div>
              <div>
                <label className="block text-text-secondary text-xs font-medium mb-1">Category</label>
                <select value={newPost.category} onChange={e => setNewPost({ ...newPost, category: e.target.value })} className="w-full bg-surface-elevated border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-accent focus:border-accent outline-none">
                  <option value="general">General</option>
                  <option value="qna">Q&A</option>
                  <option value="discussion">Discussion</option>
                  <option value="showcase">Showcase</option>
                </select>
              </div>
              <div>
                <label className="block text-text-secondary text-xs font-medium mb-1">Tags (comma-separated)</label>
                <input value={newPost.tags} onChange={e => setNewPost({ ...newPost, tags: e.target.value })} placeholder="VLSI, GATE2026, IISc" className="w-full bg-surface-elevated border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-accent focus:border-accent outline-none" />
              </div>
              <button
                onClick={handleCreatePost}
                disabled={posting}
                className="w-full flex items-center justify-center gap-2 bg-accent text-bg-primary rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
