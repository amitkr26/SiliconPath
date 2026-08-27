"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, ThumbsUp, Plus, TrendingUp, Clock, Tag, User, Loader2, Sparkles, Send } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  upvotes: number;
  created_at: string;
  user_profiles?: {
    display_name: string;
  };
}

export default function CommunityPage() {
  const { user } = useUser();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"latest" | "trending">("latest");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [showComposer, setShowComposer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTag, setNewTag] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/community/posts?sort=${sort}&limit=30`);
      if (!res.ok) throw new Error("Failed to load community discussions");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err: any) {
      setError(err.message || "Failed to load discussions");
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleUpvote = async (postId: string) => {
    if (!user) {
      toast.error("Please login to upvote discussions");
      return;
    }

    try {
      const res = await fetch("/api/community/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, vote_type: "up" }),
      });
      if (!res.ok) {
        toast.error("Failed to register upvote");
        return;
      }

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, upvotes: (p.upvotes || 0) + 1 } : p))
      );
      toast.success("Upvoted!");
    } catch (err) {
      toast.error("Error upvoting");
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to post a discussion");
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setSubmitting(true);
    try {
      const tags = newTag
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          tags: tags.length > 0 ? tags : ["hardware", "vlsi"],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to publish post");
      }

      const created = await res.json();
      setPosts((prev) => [created, ...prev]);
      setNewTitle("");
      setNewContent("");
      setNewTag("");
      setShowComposer(false);
      toast.success("Discussion published!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags || []))).slice(0, 10);
  const filteredPosts = selectedTag === "all" ? posts : posts.filter((p) => p.tags?.includes(selectedTag));

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-border-subtle">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-accent" />
              Silicon & Hardware Community
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Discuss VLSI design, semiconductor verification, physical design, and hardware career opportunities.
            </p>
          </div>
          <Button
            onClick={() => {
              if (!user) {
                toast.error("Please login to start a discussion");
                return;
              }
              setShowComposer(!showComposer);
            }}
            variant="primary"
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            {showComposer ? "Close Composer" : "Start Discussion"}
          </Button>
        </div>

        {/* Composer Modal/Drawer */}
        {showComposer && (
          <Card className="my-6 p-6 border-accent/30 bg-bg-secondary/50">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" /> New Technical Discussion
            </h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Topic Title *
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Best practices for UVM verification testbenches in SystemVerilog"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Discussion Content *
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  placeholder="Share details, problem statements, architecture choices, or insights..."
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Tags (comma-separated)
                </label>
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="e.g. uvm, verification, systemverilog"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowComposer(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submitting} className="flex items-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publish Discussion
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Layout with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-4">
            {/* Sort & Filters Toolbar */}
            <div className="flex items-center justify-between bg-bg-secondary p-3 rounded-lg border border-border-subtle">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSort("latest")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    sort === "latest" ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> Latest
                </button>
                <button
                  onClick={() => setSort("trending")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    sort === "trending" ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Trending
                </button>
              </div>
              <span className="text-xs text-text-muted">
                {filteredPosts.length} {filteredPosts.length === 1 ? "discussion" : "discussions"}
              </span>
            </div>

            {/* Posts List */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-text-secondary">
                <Loader2 className="w-8 h-8 animate-spin text-accent mb-2" />
                <p className="text-sm">Loading discussions...</p>
              </div>
            ) : error ? (
              <Card className="p-8 text-center border-red-500/20">
                <p className="text-red-400 text-sm mb-4">{error}</p>
                <Button onClick={fetchPosts} variant="secondary" size="sm">
                  Retry Loading
                </Button>
              </Card>
            ) : filteredPosts.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <h3 className="text-base font-bold text-text-primary mb-1">No discussions found</h3>
                <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
                  {selectedTag !== "all"
                    ? `No discussions with tag #${selectedTag}. Try selecting another tag.`
                    : "Be the first hardware engineer to start a discussion in this topic!"}
                </p>
                <Button onClick={() => setShowComposer(true)} variant="primary" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Start Discussion
                </Button>
              </Card>
            ) : (
              filteredPosts.map((post) => (
                <Card key={post.id} className="p-5 hover:border-accent/40 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Upvote Pill */}
                    <button
                      onClick={() => handleUpvote(post.id)}
                      className="flex flex-col items-center justify-center min-w-[44px] px-2 py-2 rounded-lg bg-bg-primary border border-border-subtle hover:border-accent hover:text-accent transition-colors"
                      title="Upvote discussion"
                    >
                      <ThumbsUp className="w-4 h-4 mb-1 text-text-muted hover:text-accent" />
                      <span className="text-xs font-bold text-text-primary">{post.upvotes || 0}</span>
                    </button>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                        <span className="flex items-center gap-1 font-medium text-text-secondary">
                          <User className="w-3 h-3" />
                          {post.user_profiles?.display_name || "Hardware Engineer"}
                        </span>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-base font-semibold text-text-primary mb-1.5 leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-sm text-text-secondary line-clamp-3 mb-3 leading-relaxed">
                        {post.content}
                      </p>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              onClick={() => setSelectedTag(tag === selectedTag ? "all" : tag)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer transition-colors ${
                                selectedTag === tag
                                  ? "bg-accent/20 text-accent font-medium"
                                  : "bg-bg-primary border border-border-subtle text-text-secondary hover:text-text-primary"
                              }`}
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tag Cloud */}
            <Card className="p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">
                Trending Topics
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedTag("all")}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    selectedTag === "all"
                      ? "bg-accent text-white"
                      : "bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-subtle"
                  }`}
                >
                  All Topics
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? "all" : tag)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedTag === tag
                        ? "bg-accent text-white"
                        : "bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-subtle"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </Card>

            {/* Quick Links */}
            <Card className="p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">
                Explore Portals
              </h3>
              <div className="space-y-2">
                <Link
                  href="/opportunities"
                  className="block text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  → Research & VLSI Opportunities
                </Link>
                <Link
                  href="/news"
                  className="block text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  → Semiconductor News & Tech Updates
                </Link>
                <Link
                  href="/academy"
                  className="block text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  → BerojgarDegreeWala Learning Academy
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
